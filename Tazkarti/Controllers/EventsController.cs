using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tazkarti.DTOs.Events;
using Tazkarti.Services;

namespace Tazkarti.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController(EventService eventService) : ControllerBase
{
    // POST /api/events/create
    [HttpPost("create")]
    [Authorize(Policy = "AdminOnly")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Create([FromForm] CreateEventDto dto)
    {
        var imageFile = Request.Form.Files.GetFile("image")
            ?? throw new Helpers.BadRequestException("Image file is required");

        ValidateImageFile(imageFile);

        var createdById = User.FindFirstValue(ClaimTypes.NameIdentifier)!; // string, no Parse
        var ev = await eventService.CreateEventAsync(dto, imageFile, createdById);
        return StatusCode(201, ev);
    }

    // GET /api/events/getAllEvents
    [HttpGet("getAllEvents")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await eventService.GetAllEventsAsync(category, pageNumber, pageSize);
        return Ok(result);
    }

    // GET /api/events/getEventById/{id}
    [HttpGet("getEventById/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
        => Ok(await eventService.GetEventByIdAsync(id));

    // PUT /api/events/updateEvent/{id}
    [HttpPut("updateEvent/{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Update(Guid id, [FromForm] UpdateEventDto dto)
    {
        IFormFile? imageFile = null;
        var rawFile = Request.Form.Files.GetFile("image");
        if (rawFile is not null)
        {
            ValidateImageFile(rawFile);
            imageFile = rawFile;
        }
        return Ok(await eventService.UpdateEventAsync(id, dto, imageFile));
    }

    // DELETE /api/events/deleteEvent/{id}
    [HttpDelete("deleteEvent/{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await eventService.DeleteEventAsync(id);
        return Ok(new { message = "Event deleted successfully" });
    }

    private static readonly HashSet<string> AllowedMimeTypes =
        ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

    private static void ValidateImageFile(IFormFile file)
    {
        if (!AllowedMimeTypes.Contains(file.ContentType.ToLower()))
            throw new Helpers.BadRequestException("Only JPEG, PNG, GIF, and WebP images are allowed");

        if (file.Length > 5 * 1024 * 1024)
            throw new Helpers.BadRequestException("Image must be smaller than 5 MB");
    }
}