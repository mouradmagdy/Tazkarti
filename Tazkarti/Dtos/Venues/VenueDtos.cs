using System.ComponentModel.DataAnnotations;

namespace Tazkarti.Dtos.Venues;

public class CreateVenueDto
{
    [Required, MinLength(2), MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Address { get; set; }

    public List<CreateSectionDto> Sections { get; set; } = [];
}

public class CreateSectionDto
{
    [Required, MinLength(1), MaxLength(60)]
    public string Name { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    [MaxLength(20)]
    public string? Color { get; set; }

    public List<CreateSeatDto> Seats { get; set; } = [];
}

public class CreateSeatDto
{
    [Required, MaxLength(20)]
    public string Row { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Number { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Label { get; set; }

    public decimal X { get; set; }
    public decimal Y { get; set; }
    public bool IsAccessible { get; set; }
}

public class VenueResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int SeatCount { get; set; }
    public IEnumerable<SectionResponseDto> Sections { get; set; } = [];
}

public class SectionResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string? Color { get; set; }
    public IEnumerable<SeatResponseDto> Seats { get; set; } = [];
}

public class SeatResponseDto
{
    public Guid Id { get; set; }
    public string Row { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public bool IsAccessible { get; set; }
}
