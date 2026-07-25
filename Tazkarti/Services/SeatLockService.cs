using CloudinaryDotNet.Actions;
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
        private IDatabase Cache => redis.GetDatabase();


        /* here we use redis to reserve the seat for the user
        we could have stored in db but we would require a more complex logic to make its ttl exactly 5 minutes
         */
        public async Task<bool> TryLockAsync(Guid eventId, string userId)
        {
            var ev = await db.Events.FindAsync(eventId) ?? throw new NotFoundException("Event not found");
            if (ev.AvailableSeats <= 0)
            {
                logger.LogInformation("No seats available for event {EventId}", eventId);
                return false;
            }
            var locked = await Cache.StringSetAsync(LockKey(eventId, userId), userId, TimeSpan.FromSeconds(LockTtlSeconds), When.NotExists);

            logger.LogInformation(locked ? "Seat locked for user {UserId} on event {EventId}" : "User {UserId} already holds a lock for event {EventId}", userId, eventId);
            return locked;
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
                var ev = await db.Events.FirstOrDefaultAsync(e => e.Id == eventId) ?? throw new NotFoundException("Event not found");
                if (ev.AvailableSeats <= 0)
                {
                    throw new ConflictException("No seats available");
                }
                ev.AvailableSeats--;
                var booking = new Booking
                {
                    EventId = eventId,
                    UserId = userId,
                    Status = "Confirmed", // i think we can remove this now
                };
                db.Bookings.Add(booking);
                await db.SaveChangesAsync();

                await tx.CommitAsync();
                await Cache.KeyDeleteAsync(key);
                logger.LogInformation("Booking confirmed. User {UserId}, Event {EventId}, Booking {BookingId}", userId, eventId, booking.Id);

                return booking;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

        }
        private static string LockKey(Guid eventId, string userId)
        {
            return $"lock:seat:{eventId}:{userId}";
        }
        public async Task ReleaseLockAsync(Guid eventId, string userId)
    => await Cache.KeyDeleteAsync(LockKey(eventId, userId));

        public async Task<TimeSpan?> GetLockTtlAsync(Guid eventId, string userId)
            => await Cache.KeyTimeToLiveAsync(LockKey(eventId, userId));
    }
}
