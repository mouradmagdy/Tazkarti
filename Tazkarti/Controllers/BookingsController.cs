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
    // POST /api/bookings/lock-seats
    [HttpPost("lock-seats")]
    public async Task<IActionResult> LockSeats([FromBody] LockEventSeatsDto dto)
        => Ok(await seatLockService.TryLockSelectedSeatsAsync(
            dto.EventId,
            dto.EventSeatIds,
            GetUserId()));

    // POST /api/bookings/confirm-seats
    [HttpPost("confirm-seats")]
    public async Task<IActionResult> ConfirmSeats([FromBody] ConfirmSeatBookingDto dto)
        => StatusCode(201, await seatLockService.ConfirmSelectedSeatsAsync(
            dto.EventId,
            dto.EventSeatIds,
            GetUserId()));

    // POST /api/bookings/release-seats
    [HttpPost("release-seats")]
    public async Task<IActionResult> ReleaseSeats([FromBody] ReleaseEventSeatsDto dto)
    {
        var released = await seatLockService.ReleaseSelectedSeatLocksAsync(dto.EventSeatIds, GetUserId());
        return Ok(new { message = "Reservation cancelled.", released });
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
