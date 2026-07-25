using System.ComponentModel.DataAnnotations;

namespace Tazkarti.Dtos.Bookings
{
    public class ConfirmBookingDto
    {
        [Required]
        public Guid EventId { get; set; }
    }
}
