using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using Tazkarti.Data;
using Tazkarti.DTOs.Events;
using Tazkarti.Helpers;
using Tazkarti.Models;

namespace Tazkarti.Services;

public class EventService(AppDbContext db, Cloudinary cloudinary, ILogger<EventService> logger)
{
    private static readonly HashSet<string> ValidCategories =
        ["music", "sports", "art", "technology", "other"];

    public async Task<EventResponseDto> CreateEventAsync(
        CreateEventDto dto,
        IFormFile imageFile,
        string createdById)    // string — IdentityUser.Id
    {
        ValidateCategory(dto.Category);
        if (dto.VenueId is not null && !await db.Venues.AnyAsync(v => v.Id == dto.VenueId.Value))
            throw new BadRequestException("Venue layout does not exist.");

        var imageUrl = await UploadImageAsync(imageFile);

        var layoutSeatCount = dto.VenueId is null
            ? 0
            : await db.Seats.CountAsync(s => s.Section.VenueId == dto.VenueId.Value);

        if (dto.VenueId is not null && layoutSeatCount == 0)
            throw new BadRequestException("Venue layout must have seats before it can be assigned to an event.");

        var totalSeats = dto.VenueId is null ? dto.TotalSeats : layoutSeatCount;
        var ev = new Event
        {
            Name = dto.Name,
            Description = dto.Description,
            Category = dto.Category,
            Venue = dto.Venue,
            VenueId = dto.VenueId,
            Price = dto.Price,
            Date = dto.Date.ToUniversalTime(),
            TotalSeats = totalSeats,
            AvailableSeats = totalSeats,
            Image = imageUrl,
            CreatedById = createdById
        };

        db.Events.Add(ev);
        if (dto.VenueId is not null)
            await AddEventSeatsAsync(ev, dto.VenueId.Value, dto.Price);

        await db.SaveChangesAsync();

        logger.LogInformation("Event created: {EventId}", ev.Id);
        return ToDto(ev);
    }

    public async Task<PaginatedEventsDto> GetAllEventsAsync(
        string? category,
        int pageNumber = 1,
        int pageSize = 10)
    {
        var query = db.Events.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Category == category);

        var total = await query.CountAsync();
        var events = await query
            .OrderBy(e => e.Date)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedEventsDto
        {
            Events = events.Select(ToDto),
            TotalEvents = total,
            Page = pageNumber,
            Limit = pageSize
        };
    }

    public async Task<EventResponseDto> GetEventByIdAsync(Guid id)
    {
        var ev = await db.Events.FindAsync(id)
            ?? throw new NotFoundException("Event not found");
        return ToDto(ev);
    }

    public async Task<EventResponseDto> UpdateEventAsync(
        Guid id,
        UpdateEventDto dto,
        IFormFile? imageFile = null)
    {
        var ev = await db.Events.FindAsync(id)
            ?? throw new NotFoundException("Event not found");

        if (dto.Name is not null) ev.Name = dto.Name;
        if (dto.Description is not null) ev.Description = dto.Description;
        if (dto.Venue is not null) ev.Venue = dto.Venue;
        if (dto.VenueId is not null)
        {
            if (!await db.Venues.AnyAsync(v => v.Id == dto.VenueId.Value))
                throw new BadRequestException("Venue layout does not exist.");

            var hasBookings = await db.Bookings.AnyAsync(b => b.EventId == id);
            if (hasBookings && ev.VenueId != dto.VenueId)
                throw new BadRequestException("Venue layout cannot be changed after bookings exist.");

            ev.VenueId = dto.VenueId;

            if (!await db.EventSeats.AnyAsync(es => es.EventId == id))
            {
                var layoutSeatCount = await db.Seats.CountAsync(s => s.Section.VenueId == dto.VenueId.Value);
                if (layoutSeatCount == 0)
                    throw new BadRequestException("Venue layout must have seats before it can be assigned to an event.");

                ev.TotalSeats = layoutSeatCount;
                ev.AvailableSeats = layoutSeatCount;
                await AddEventSeatsAsync(ev, dto.VenueId.Value, dto.Price ?? ev.Price);
            }
        }
        if (dto.Price is not null) ev.Price = dto.Price.Value;
        if (dto.Date is not null) ev.Date = dto.Date.Value.ToUniversalTime();
        if (dto.Image is not null) ev.Image = dto.Image;

        if (dto.Category is not null)
        {
            ValidateCategory(dto.Category);
            ev.Category = dto.Category;
        }

        if (dto.TotalSeats is not null)
        {
            var bookedSeats = ev.TotalSeats - ev.AvailableSeats;
            if (dto.TotalSeats.Value < bookedSeats)
                throw new BadRequestException("Total seats cannot be lower than the number of already booked seats.");

            var diff = dto.TotalSeats.Value - ev.TotalSeats;
            ev.TotalSeats = dto.TotalSeats.Value;
            ev.AvailableSeats = Math.Max(0, ev.AvailableSeats + diff);
        }

        if (imageFile is not null)
            ev.Image = await UploadImageAsync(imageFile);

        await db.SaveChangesAsync();
        logger.LogInformation("Event updated: {EventId}", ev.Id);
        return ToDto(ev);
    }

    public async Task DeleteEventAsync(Guid id)
    {
        var ev = await db.Events.FindAsync(id)
            ?? throw new NotFoundException("Event not found");

        db.Events.Remove(ev);
        await db.SaveChangesAsync();
        logger.LogInformation("Event deleted: {EventId}", id);
    }

    private async Task<string> UploadImageAsync(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        var result = await cloudinary.UploadAsync(new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "events",
            Transformation = new Transformation().FetchFormat("auto").Quality("auto")
        });

        if (result.Error is not null)
            throw new AppException("Image upload failed");

        return result.SecureUrl.ToString();
    }

    private async Task AddEventSeatsAsync(Event ev, Guid venueId, decimal defaultPrice)
    {
        var seatIds = await db.Seats
            .Where(s => s.Section.VenueId == venueId)
            .Select(s => s.Id)
            .ToListAsync();

        foreach (var seatId in seatIds)
        {
            ev.EventSeats.Add(new EventSeat
            {
                SeatId = seatId,
                Price = defaultPrice,
                Status = "available"
            });
        }
    }

    private static void ValidateCategory(string category)
    {
        if (!ValidCategories.Contains(category))
            throw new BadRequestException(
                $"Invalid category. Allowed: {string.Join(", ", ValidCategories)}");
    }

    private static EventResponseDto ToDto(Event e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Description = e.Description,
        Category = e.Category,
        Venue = e.Venue,
        VenueId = e.VenueId,
        Price = e.Price,
        Image = e.Image,
        Date = e.Date,
        TotalSeats = e.TotalSeats,
        AvailableSeats = e.AvailableSeats,
        CreatedAt = e.CreatedAt,
        CreatedById = e.CreatedById
    };
}
