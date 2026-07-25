using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using Tazkarti.Data;
using Tazkarti.Dtos.Bookings;
using Tazkarti.Helpers;
using Tazkarti.Models;

namespace Tazkarti.Services
{
    public class SeatLockService(IConnectionMultiplexer redis, AppDbContext db, ILogger<SeatLockService> logger)
    {
        private const int LockTtlSeconds = 300;
        private const int MaxSeatsPerBooking = 8;
        private const string SeatStatusHeld = "held";

        private const string TryLockSelectedSeatsScript = """
            for i = 1, #KEYS do
                local owner = redis.call('GET', KEYS[i])
                if owner and owner ~= ARGV[1] then
                    return 0
                end
            end

            for i = 1, #KEYS do
                redis.call('SET', KEYS[i], ARGV[1], 'PX', ARGV[2])
            end

            return 1
            """;

        private const string ReleaseSelectedSeatsScript = """
            local released = 0
            for i = 1, #KEYS do
                if redis.call('GET', KEYS[i]) == ARGV[1] then
                    redis.call('DEL', KEYS[i])
                    released = released + 1
                end
            end
            return released
            """;

        private IDatabase Cache => redis.GetDatabase();

        public async Task<SeatMapDto> GetSeatMapAsync(Guid eventId)
        {
            var ev = await db.Events
                .AsNoTracking()
                .Include(e => e.VenueLayout)
                .FirstOrDefaultAsync(e => e.Id == eventId)
                ?? throw new NotFoundException("Event not found");

            if (ev.VenueId is null)
                throw new BadRequestException("This event does not have an assigned-seat layout.");

            var seats = await db.EventSeats
                .AsNoTracking()
                .Where(es => es.EventId == eventId)
                .Select(es => new
                {
                    EventSeatId = es.Id,
                    SeatId = es.SeatId,
                    es.Price,
                    es.Status,
                    es.Seat.Row,
                    es.Seat.Number,
                    es.Seat.Label,
                    es.Seat.X,
                    es.Seat.Y,
                    es.Seat.IsAccessible,
                    SectionId = es.Seat.Section.Id,
                    SectionName = es.Seat.Section.Name,
                    es.Seat.Section.DisplayOrder,
                    es.Seat.Section.Color
                })
                .ToListAsync();

            if (seats.Count == 0)
                throw new BadRequestException("This event does not have event seats generated yet.");

            var lockValues = await Cache.StringGetAsync(
                seats.Select(s => (RedisKey)EventSeatLockKey(s.EventSeatId)).ToArray());

            var heldSeatIds = seats
                .Where((_, index) => !lockValues[index].IsNullOrEmpty)
                .Select(s => s.EventSeatId)
                .ToHashSet();

            return new SeatMapDto
            {
                EventId = ev.Id,
                EventName = ev.Name,
                VenueId = ev.VenueId,
                VenueName = ev.VenueLayout?.Name ?? ev.Venue,
                Sections = seats
                    .GroupBy(s => new { s.SectionId, s.SectionName, s.DisplayOrder, s.Color })
                    .OrderBy(g => g.Key.DisplayOrder)
                    .ThenBy(g => g.Key.SectionName)
                    .Select(g => new SeatMapSectionDto
                    {
                        Id = g.Key.SectionId,
                        Name = g.Key.SectionName,
                        DisplayOrder = g.Key.DisplayOrder,
                        Color = g.Key.Color,
                        Seats = g
                            .OrderBy(s => s.Row)
                            .ThenBy(s => s.Number)
                            .Select(s => new SeatMapSeatDto
                            {
                                EventSeatId = s.EventSeatId,
                                SeatId = s.SeatId,
                                Row = s.Row,
                                Number = s.Number,
                                Label = s.Label,
                                X = s.X,
                                Y = s.Y,
                                IsAccessible = s.IsAccessible,
                                Price = s.Price,
                                Status = s.Status == EventSeatStatus.Available && heldSeatIds.Contains(s.EventSeatId)
                                    ? SeatStatusHeld
                                    : ToApiStatus(s.Status)
                            })
                    })
            };
        }

        public async Task<LockResponseDto> TryLockSelectedSeatsAsync(
            Guid eventId,
            IReadOnlyCollection<Guid> eventSeatIds,
            string userId)
        {
            var seatIds = NormalizeSeatSelection(eventSeatIds);
            var selectedSeats = await GetSelectedEventSeatsAsync(eventId, seatIds);

            if (selectedSeats.Any(s => s.Status != EventSeatStatus.Available))
                throw new ConflictException("One or more selected seats are no longer available.");

            var locked = (int)(long)await Cache.ScriptEvaluateAsync(
                TryLockSelectedSeatsScript,
                seatIds.Select(id => (RedisKey)EventSeatLockKey(id)).ToArray(),
                [userId, LockTtlSeconds * 1000]);

            if (locked != 1)
                throw new ConflictException("One or more selected seats are already held by another user.");

            logger.LogInformation(
                "Locked {SeatCount} assigned seats for user {UserId} on event {EventId}",
                seatIds.Count,
                userId,
                eventId);

            return new LockResponseDto
            {
                Message = "Seats locked for 5 minutes. Complete your booking before the timer expires.",
                ExpiresInSeconds = LockTtlSeconds
            };
        }

        public async Task<AssignedSeatBookingResponseDto> ConfirmSelectedSeatsAsync(
            Guid eventId,
            IReadOnlyCollection<Guid> eventSeatIds,
            string userId)
        {
            var seatIds = NormalizeSeatSelection(eventSeatIds);
            var selectedSeats = await GetSelectedEventSeatsAsync(eventId, seatIds);
            await EnsureUserOwnsSeatLocksAsync(seatIds, userId);

            var strategy = db.Database.CreateExecutionStrategy();
            var response = await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync();
                try
                {
                    var updatedSeats = await db.EventSeats
                        .Where(es =>
                            es.EventId == eventId &&
                            seatIds.Contains(es.Id) &&
                            es.Status == EventSeatStatus.Available)
                        .ExecuteUpdateAsync(s =>
                            s.SetProperty(es => es.Status, EventSeatStatus.Sold));

                    if (updatedSeats != seatIds.Count)
                        throw new ConflictException("One or more selected seats are no longer available.");

                    var updatedEvent = await db.Events
                        .Where(e => e.Id == eventId && e.AvailableSeats >= seatIds.Count)
                        .ExecuteUpdateAsync(s =>
                            s.SetProperty(e => e.AvailableSeats, e => e.AvailableSeats - seatIds.Count));

                    if (updatedEvent == 0)
                        throw new ConflictException("Not enough seats are available for this event.");

                    var booking = new Booking
                    {
                        EventId = eventId,
                        UserId = userId,
                        Status = BookingStatus.Confirmed
                    };

                    db.Bookings.Add(booking);
                    await db.SaveChangesAsync();

                    foreach (var seat in selectedSeats)
                    {
                        db.BookingSeats.Add(new BookingSeat
                        {
                            BookingId = booking.Id,
                            EventSeatId = seat.EventSeatId,
                            Price = seat.Price
                        });
                    }

                    await db.SaveChangesAsync();
                    await tx.CommitAsync();

                    return new AssignedSeatBookingResponseDto
                    {
                        Message = "Booking confirmed successfully.",
                        BookingId = booking.Id,
                        EventId = eventId,
                        Status = ToApiStatus(booking.Status),
                        TotalPrice = selectedSeats.Sum(s => s.Price),
                        Seats = selectedSeats.Select(s => new BookedSeatDto
                        {
                            EventSeatId = s.EventSeatId,
                            Label = s.Label,
                            Section = s.SectionName,
                            Price = s.Price
                        })
                    };
                }
                catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
                {
                    await tx.RollbackAsync();
                    throw new ConflictException("One or more selected seats were already booked.");
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });

            await ReleaseSelectedSeatLocksAsync(seatIds, userId);

            logger.LogInformation(
                "Assigned-seat booking confirmed. User {UserId}, Event {EventId}, Booking {BookingId}, Seats {SeatCount}",
                userId,
                eventId,
                response.BookingId,
                seatIds.Count);

            return response;
        }

        public async Task<int> ReleaseSelectedSeatLocksAsync(
            IReadOnlyCollection<Guid> eventSeatIds,
            string userId)
        {
            var seatIds = NormalizeSeatSelection(eventSeatIds);
            var released = (int)(long)await Cache.ScriptEvaluateAsync(
                ReleaseSelectedSeatsScript,
                seatIds.Select(id => (RedisKey)EventSeatLockKey(id)).ToArray(),
                [userId]);

            logger.LogInformation(
                "Released {SeatCount} assigned-seat locks for user {UserId}",
                released,
                userId);

            return released;
        }

        private async Task EnsureUserOwnsSeatLocksAsync(IReadOnlyCollection<Guid> seatIds, string userId)
        {
            var values = await Cache.StringGetAsync(
                seatIds.Select(id => (RedisKey)EventSeatLockKey(id)).ToArray());

            if (values.Any(value => value.IsNullOrEmpty || value.ToString() != userId))
                throw new ConflictException("Seat lock expired or not found. Please try again.");
        }

        private async Task<List<SelectedEventSeat>> GetSelectedEventSeatsAsync(
            Guid eventId,
            IReadOnlyCollection<Guid> seatIds)
        {
            var selectedSeats = await db.EventSeats
                .AsNoTracking()
                .Where(es => es.EventId == eventId && seatIds.Contains(es.Id))
                .Select(es => new SelectedEventSeat(
                    es.Id,
                    es.Price,
                    es.Status,
                    es.Seat.Label,
                    es.Seat.Section.Name))
                .ToListAsync();

            if (selectedSeats.Count != seatIds.Count)
            {
                var eventExists = await db.Events.AnyAsync(e => e.Id == eventId);
                throw eventExists
                    ? new BadRequestException("One or more selected seats do not belong to this event.")
                    : new NotFoundException("Event not found");
            }

            return selectedSeats;
        }

        private static List<Guid> NormalizeSeatSelection(IReadOnlyCollection<Guid> eventSeatIds)
        {
            if (eventSeatIds.Count == 0)
                throw new BadRequestException("Select at least one seat.");

            var distinctSeatIds = eventSeatIds.Distinct().ToList();
            if (distinctSeatIds.Count != eventSeatIds.Count)
                throw new BadRequestException("Duplicate seat selections are not allowed.");

            if (distinctSeatIds.Count > MaxSeatsPerBooking)
                throw new BadRequestException($"You can book up to {MaxSeatsPerBooking} seats at once.");

            return distinctSeatIds;
        }

        private static string EventSeatLockKey(Guid eventSeatId)
            => $"lock:event-seat:{eventSeatId}";

        private static bool IsUniqueConstraintViolation(DbUpdateException ex)
            => ex.InnerException?.Message.Contains("IX_BookingSeats_EventSeatId", StringComparison.OrdinalIgnoreCase) == true
               || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true;

        private sealed record SelectedEventSeat(
            Guid EventSeatId,
            decimal Price,
            EventSeatStatus Status,
            string Label,
            string SectionName);

        private static string ToApiStatus(BookingStatus status)
            => status.ToString().ToLowerInvariant();

        private static string ToApiStatus(EventSeatStatus status)
            => status.ToString().ToLowerInvariant();
    }
}
