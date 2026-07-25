namespace Tazkarti.Models
{
    public class EventSeat
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public Guid SeatId { get; set; }
        public decimal Price { get; set; }
        public EventSeatStatus Status { get; set; } = EventSeatStatus.Available;

        public Event Event { get; set; } = null!;
        public Seat Seat { get; set; } = null!;
        public ICollection<BookingSeat> BookingSeats { get; set; } = [];
    }
}
