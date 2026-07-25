namespace Tazkarti.Models
{
    public class Section
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid VenueId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public string? Color { get; set; }

        public Venue Venue { get; set; } = null!;
        public ICollection<Seat> Seats { get; set; } = [];
    }
}
