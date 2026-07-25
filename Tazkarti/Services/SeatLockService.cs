using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using Tazkarti.Data;
using Tazkarti.Helpers;
using Tazkarti.Models;

namespace Tazkarti.Services
{
    public class SeatLockService(IConnectionMultiplexer redis, AppDbContext db, ILogger<SeatLockService> logger)
    {
        private const int LockTtlSeconds = 300; // 5 minutes
        private const string TryLockScript = """
            redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
            if redis.call('EXISTS', KEYS[2]) == 1 then
                return 2
            end
            if tonumber(redis.call('ZCARD', KEYS[1])) >= tonumber(ARGV[2]) then
                return 0
            end
            local setResult = redis.call('SET', KEYS[2], ARGV[5], 'PX', ARGV[3], 'NX')
            if not setResult then
                return 2
            end
            redis.call('ZADD', KEYS[1], ARGV[4], ARGV[5])
            redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[3]) + 5000)
            return 1
            """;

        private IDatabase Cache => redis.GetDatabase();

        public async Task<bool> TryLockAsync(Guid eventId, string userId)
        {
            var ev = await db.Events.FindAsync(eventId)
                ?? throw new NotFoundException("Event not found");

            if (ev.AvailableSeats <= 0)
            {
                logger.LogInformation("No seats available for event {EventId}", eventId);
                return false;
            }

            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var ttlMs = LockTtlSeconds * 1000;
            var result = (int)(long)await Cache.ScriptEvaluateAsync(
                TryLockScript,
                [
                    HoldersKey(eventId),
                    LockKey(eventId, userId)
                ],
                [
                    now,
                    ev.AvailableSeats,
                    ttlMs,
                    now + ttlMs,
                    userId
                ]);

            if (result == 1)
            {
                logger.LogInformation("Seat locked for user {UserId} on event {EventId}", userId, eventId);
                return true;
            }

            if (result == 2)
            {
                logger.LogInformation(
                    "User {UserId} already holds a lock for event {EventId}",
                    userId,
                    eventId);
            }
            else
            {
                logger.LogInformation("No hold capacity available for event {EventId}", eventId);
            }

            return false;
        }

        public async Task<Booking> ConfirmAndBookAsync(Guid eventId, string userId)
        {
            var key = LockKey(eventId, userId);
            var val = await Cache.StringGetAsync(key);

            if (val.IsNullOrEmpty || val.ToString() != userId)
                throw new ConflictException("Seat lock expired or not found. Please try again.");

            await using var tx = await db.Database.BeginTransactionAsync();
            try
            {
                var updated = await db.Events
                    .Where(e => e.Id == eventId && e.AvailableSeats > 0)
                    .ExecuteUpdateAsync(s =>
                        s.SetProperty(e => e.AvailableSeats, e => e.AvailableSeats - 1));

                if (updated == 0)
                {
                    var exists = await db.Events.AnyAsync(e => e.Id == eventId);
                    throw exists
                        ? new ConflictException("No seats available")
                        : new NotFoundException("Event not found");
                }

                var booking = new Booking
                {
                    EventId = eventId,
                    UserId = userId,
                    Status = "confirmed",
                };

                db.Bookings.Add(booking);
                await db.SaveChangesAsync();

                await tx.CommitAsync();
                await ReleaseHoldAsync(eventId, userId);
                logger.LogInformation(
                    "Booking confirmed. User {UserId}, Event {EventId}, Booking {BookingId}",
                    userId,
                    eventId,
                    booking.Id);

                return booking;
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                await tx.RollbackAsync();
                throw new ConflictException("You already booked this event.");
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task ReleaseLockAsync(Guid eventId, string userId)
            => await ReleaseHoldAsync(eventId, userId);

        public async Task<TimeSpan?> GetLockTtlAsync(Guid eventId, string userId)
            => await Cache.KeyTimeToLiveAsync(LockKey(eventId, userId));

        private async Task ReleaseHoldAsync(Guid eventId, string userId)
        {
            await Cache.KeyDeleteAsync(LockKey(eventId, userId));
            await Cache.SortedSetRemoveAsync(HoldersKey(eventId), userId);
        }

        private static string LockKey(Guid eventId, string userId)
            => $"lock:seat:{eventId}:{userId}";

        private static string HoldersKey(Guid eventId)
            => $"lock:seat:{eventId}:holders";

        private static bool IsUniqueConstraintViolation(DbUpdateException ex)
            => ex.InnerException?.Message.Contains("IX_Bookings_EventId_UserId", StringComparison.OrdinalIgnoreCase) == true
               || ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true;
    }
}
