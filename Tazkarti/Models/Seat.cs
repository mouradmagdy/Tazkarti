namespace Tazkarti.Models
{
    public class Seat
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SectionId { get; set; }
        public string Row { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public decimal X { get; set; }
        public decimal Y { get; set; }
        public bool IsAccessible { get; set; }

        public Section Section { get; set; } = null!;
        public ICollection<EventSeat> EventSeats { get; set; } = [];
    }
}
