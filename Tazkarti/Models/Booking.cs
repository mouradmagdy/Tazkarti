namespace Tazkarti.Models
{
    public class Booking
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }                       // indexed
        public string UserId { get; set; } = string.Empty;        // indexed
        public string Status { get; set; } = "confirmed";       // "confirmed" | "cancelled"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Event Event { get; set; } = null!;
        public User User { get; set; } = null!;
        public ICollection<BookingSeat> Seats { get; set; } = [];
    }
}
