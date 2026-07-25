namespace Tazkarti.Dtos.Bookings
{
    public class BookingEventDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Venue { get; set; } = string.Empty;
    }
}
