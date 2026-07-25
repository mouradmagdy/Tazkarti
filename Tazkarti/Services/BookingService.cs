using Microsoft.EntityFrameworkCore;
using Tazkarti.Data;
using Tazkarti.Dtos.Bookings;
using Tazkarti.Helpers;
using Tazkarti.Models;

namespace Tazkarti.Services;

public class BookingService(AppDbContext db, ILogger<BookingService> logger)
{
    public async Task<IEnumerable<BookingResponseDto>> GetBookingsByUserAsync(string userId)
    {
        var bookings = await db.Bookings
            .Include(b => b.Event)
            .Include(b => b.User)
            .Include(b => b.Seats)
                .ThenInclude(bs => bs.EventSeat)
                .ThenInclude(es => es.Seat)
                .ThenInclude(s => s.Section)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bookings.Select(ToDto);
    }

    public async Task DeleteBookingAsync(Guid bookingId, string requestingUserId, string requestingRole)
    {
        var booking = await db.Bookings
            .Include(b => b.Event)
            .Include(b => b.Seats)
                .ThenInclude(bs => bs.EventSeat)
            .FirstOrDefaultAsync(b => b.Id == bookingId)
            ?? throw new NotFoundException("Booking not found");

        if (requestingRole != "admin" && booking.UserId != requestingUserId)
            throw new ForbiddenException("You are not authorised to cancel this booking");

        var releasedSeatCount = booking.Seats.Count;
        foreach (var bookingSeat in booking.Seats)
        {
            bookingSeat.EventSeat.Status = EventSeatStatus.Available;
        }

        booking.Event.AvailableSeats = Math.Min(
            booking.Event.TotalSeats,
            booking.Event.AvailableSeats + (releasedSeatCount > 0 ? releasedSeatCount : 1));

        db.Bookings.Remove(booking);
        await db.SaveChangesAsync();

        logger.LogInformation("Booking {BookingId} deleted by {UserId}", bookingId, requestingUserId);
    }

    private static BookingResponseDto ToDto(Models.Booking b) => new()
    {
        Id = b.Id,
        Status = b.Status.ToString().ToLowerInvariant(),
        CreatedAt = b.CreatedAt,
        Event = new BookingEventDto
        {
            Id = b.Event.Id,
            Name = b.Event.Name,
            Date = b.Event.Date,
            Venue = b.Event.Venue
        },
        User = new BookingUserDto
        {
            Id = b.User.Id,
            FullName = b.User.FullName,
            Username = b.User.UserName!
        },
        TotalPrice = b.Seats.Count > 0 ? b.Seats.Sum(s => s.Price) : b.Event.Price,
        Seats = b.Seats.Select(s => new BookedSeatDto
        {
            EventSeatId = s.EventSeatId,
            Label = s.EventSeat.Seat.Label,
            Section = s.EventSeat.Seat.Section.Name,
            Price = s.Price
        })
    };
}
