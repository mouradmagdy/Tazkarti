using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tazkarti.Dtos.Bookings;
using Tazkarti.Services;

namespace Tazkarti.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController(
    SeatLockService seatLockService,
    BookingService bookingService) : ControllerBase
{
    // POST /api/bookings/lock
    [HttpPost("lock")]
    public async Task<IActionResult> Lock([FromBody] LockSeatDto dto)
    {
        var success = await seatLockService.TryLockAsync(dto.EventId, GetUserId());
        if (!success)
            return Conflict(new { message = "No available seats or you already have a pending reservation." });

        return Ok(new LockResponseDto
        {
            Message = "Seat locked for 10 minutes. Complete your booking before the timer expires.",
            ExpiresInSeconds = 300
        });
    }

    // GET /api/bookings/lock-status/{eventId}
    [HttpGet("lock-status/{eventId:guid}")]
    public async Task<IActionResult> LockStatus(Guid eventId)
    {
        var ttl = await seatLockService.GetLockTtlAsync(eventId, GetUserId());
        if (ttl is null)
            return Ok(new { locked = false, remainingSeconds = 0 });

        return Ok(new { locked = true, remainingSeconds = (int)ttl.Value.TotalSeconds });
    }

    // POST /api/bookings/confirm
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] ConfirmBookingDto dto)
    {
        var booking = await seatLockService.ConfirmAndBookAsync(dto.EventId, GetUserId());
        return StatusCode(201, new
        {
            message = "Booking confirmed successfully.",
            bookingId = booking.Id,
            eventId = booking.EventId,
            status = booking.Status
        });
    }

    // DELETE /api/bookings/lock/{eventId}
    [HttpDelete("lock/{eventId:guid}")]
    public async Task<IActionResult> ReleaseLock(Guid eventId)
    {
        await seatLockService.ReleaseLockAsync(eventId, GetUserId());
        return Ok(new { message = "Reservation cancelled." });
    }

    // GET /api/bookings/user/{userId}
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(string userId)
    {
        var callerId = GetUserId();
        var callerRole = User.FindFirstValue(ClaimTypes.Role);

        if (callerRole != "admin" && callerId != userId)
            return Forbid();

        var bookings = await bookingService.GetBookingsByUserAsync(userId);
        return Ok(new { bookings, count = bookings.Count() });
    }

    // DELETE /api/bookings/deleteBooking/{id}
    [HttpDelete("deleteBooking/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await bookingService.DeleteBookingAsync(id, GetUserId(), GetUserRole());
        return Ok(new { message = "Booking deleted successfully" });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    // IdentityUser.Id is already a string — no Guid.Parse
    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role)!;
}