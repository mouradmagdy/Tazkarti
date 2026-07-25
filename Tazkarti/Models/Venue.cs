namespace Tazkarti.Models
{
    public class Venue
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Section> Sections { get; set; } = [];
        public ICollection<Event> Events { get; set; } = [];
    }
}
