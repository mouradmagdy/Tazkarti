using System.ComponentModel.DataAnnotations;

namespace Tazkarti.DTOs.Events;

public class CreateEventDto
{
    [Required, MinLength(3), MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MinLength(10), MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Required, MinLength(3), MaxLength(100)]
    public string Venue { get; set; } = string.Empty;

    [Required]
    public Guid? VenueId { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "TotalSeats must be at least 1")]
    public int? TotalSeats { get; set; }
}

public class UpdateEventDto
{
    [MinLength(3), MaxLength(100)]
    public string? Name { get; set; }

    [MinLength(10), MaxLength(1000)]
    public string? Description { get; set; }

    public string? Category { get; set; }

    [MinLength(3), MaxLength(100)]
    public string? Venue { get; set; }

    public Guid? VenueId { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Price { get; set; }

    public DateTime? Date { get; set; }

    [Range(1, int.MaxValue)]
    public int? TotalSeats { get; set; }

    public string? Image { get; set; }
}

public class EventResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Venue { get; set; } = string.Empty;
    public Guid? VenueId { get; set; }
    public decimal Price { get; set; }
    public string? Image { get; set; }
    public DateTime Date { get; set; }
    public int TotalSeats { get; set; }
    public int AvailableSeats { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedById { get; set; } = string.Empty;  // string
}

public class PaginatedEventsDto
{
    public IEnumerable<EventResponseDto> Events { get; set; } = [];
    public int TotalEvents { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
}
