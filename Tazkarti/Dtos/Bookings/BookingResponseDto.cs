namespace Tazkarti.Dtos.Bookings
{
    public class BookingResponseDto
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public BookingEventDto Event { get; set; } = null!;
        public BookingUserDto User { get; set; } = null!;
    }
}
