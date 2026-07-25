namespace Tazkarti.Models
{
    public class BookingSeat
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid BookingId { get; set; }
        public Guid EventSeatId { get; set; }
        public decimal Price { get; set; }

        public Booking Booking { get; set; } = null!;
        public EventSeat EventSeat { get; set; } = null!;
    }
}
