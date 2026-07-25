using Microsoft.EntityFrameworkCore;
using Tazkarti.Data;
using Tazkarti.Dtos.Venues;
using Tazkarti.Helpers;
using Tazkarti.Models;

namespace Tazkarti.Services;

public class VenueService(AppDbContext db, ILogger<VenueService> logger)
{
    public async Task<VenueResponseDto> CreateVenueAsync(CreateVenueDto dto)
    {
        if (dto.Sections.Count == 0)
            throw new BadRequestException("Venue must include at least one section.");

        if (dto.Sections.Any(s => s.Seats.Count == 0))
            throw new BadRequestException("Every section must include at least one seat.");

        var venue = new Venue
        {
            Name = dto.Name,
            Address = dto.Address
        };

        foreach (var sectionDto in dto.Sections)
        {
            var section = new Section
            {
                Name = sectionDto.Name,
                DisplayOrder = sectionDto.DisplayOrder,
                Color = sectionDto.Color
            };

            foreach (var seatDto in sectionDto.Seats)
            {
                var label = string.IsNullOrWhiteSpace(seatDto.Label)
                    ? $"{seatDto.Row}-{seatDto.Number}"
                    : seatDto.Label;

                section.Seats.Add(new Seat
                {
                    Row = seatDto.Row,
                    Number = seatDto.Number,
                    Label = label,
                    X = seatDto.X,
                    Y = seatDto.Y,
                    IsAccessible = seatDto.IsAccessible
                });
            }

            venue.Sections.Add(section);
        }

        db.Venues.Add(venue);
        await db.SaveChangesAsync();

        logger.LogInformation("Venue created: {VenueId}", venue.Id);
        return ToDto(venue);
    }

    public async Task<IEnumerable<VenueResponseDto>> GetAllAsync()
    {
        var venues = await VenueQuery()
            .OrderBy(v => v.Name)
            .ToListAsync();

        return venues.Select(ToDto);
    }

    public async Task<VenueResponseDto> GetByIdAsync(Guid id)
    {
        var venue = await VenueQuery().FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new NotFoundException("Venue not found");

        return ToDto(venue);
    }

    private IQueryable<Venue> VenueQuery()
        => db.Venues
            .AsNoTracking()
            .Include(v => v.Sections.OrderBy(s => s.DisplayOrder))
            .ThenInclude(s => s.Seats.OrderBy(seat => seat.Row).ThenBy(seat => seat.Number));

    private static VenueResponseDto ToDto(Venue venue) => new()
    {
        Id = venue.Id,
        Name = venue.Name,
        Address = venue.Address,
        SeatCount = venue.Sections.Sum(s => s.Seats.Count),
        Sections = venue.Sections
            .OrderBy(s => s.DisplayOrder)
            .Select(s => new SectionResponseDto
            {
                Id = s.Id,
                Name = s.Name,
                DisplayOrder = s.DisplayOrder,
                Color = s.Color,
                Seats = s.Seats
                    .OrderBy(seat => seat.Row)
                    .ThenBy(seat => seat.Number)
                    .Select(seat => new SeatResponseDto
                    {
                        Id = seat.Id,
                        Row = seat.Row,
                        Number = seat.Number,
                        Label = seat.Label,
                        X = seat.X,
                        Y = seat.Y,
                        IsAccessible = seat.IsAccessible
                    })
            })
    };
}
