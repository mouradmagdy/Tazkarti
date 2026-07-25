using System.ComponentModel.DataAnnotations;

namespace Tazkarti.Dtos.Bookings;

public class LockEventSeatsDto
{
    [Required]
    public Guid EventId { get; set; }

    [Required, MinLength(1)]
    public List<Guid> EventSeatIds { get; set; } = [];
}

public class ConfirmSeatBookingDto
{
    [Required]
    public Guid EventId { get; set; }

    [Required, MinLength(1)]
    public List<Guid> EventSeatIds { get; set; } = [];
}

public class ReleaseEventSeatsDto
{
    [Required]
    public Guid EventId { get; set; }

    [Required, MinLength(1)]
    public List<Guid> EventSeatIds { get; set; } = [];
}

public class SeatMapDto
{
    public Guid EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public Guid? VenueId { get; set; }
    public string VenueName { get; set; } = string.Empty;
    public IEnumerable<SeatMapSectionDto> Sections { get; set; } = [];
}

public class SeatMapSectionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string? Color { get; set; }
    public IEnumerable<SeatMapSeatDto> Seats { get; set; } = [];
}

public class SeatMapSeatDto
{
    public Guid EventSeatId { get; set; }
    public Guid SeatId { get; set; }
    public string Row { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public bool IsAccessible { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class AssignedSeatBookingResponseDto
{
    public string Message { get; set; } = string.Empty;
    public Guid BookingId { get; set; }
    public Guid EventId { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public IEnumerable<BookedSeatDto> Seats { get; set; } = [];
}

public class BookedSeatDto
{
    public Guid EventSeatId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public decimal Price { get; set; }
}
