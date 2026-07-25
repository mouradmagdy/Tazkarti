using System.ComponentModel.DataAnnotations;

namespace Tazkarti.Dtos.Bookings
{
    public class LockSeatDto
    {
        [Required]
        public Guid EventId { get; set; }
    }
}
