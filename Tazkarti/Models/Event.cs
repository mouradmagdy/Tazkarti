namespace Tazkarti.Models
{
    public class Event
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;   // indexed
        public string Venue { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Image { get; set; }
        public DateTime Date { get; set; }                      // indexed
        public int TotalSeats { get; set; }                     // ← NEW
        public int AvailableSeats { get; set; }                 // ← NEW (decremented on confirm)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string CreatedById { get; set; } = string.Empty;
        public User CreatedBy { get; set; } = null!;
        public ICollection<Booking> Bookings { get; set; } = [];
    }
}
