using Microsoft.AspNetCore.Identity;
using Tazkarti.Models;

namespace Tazkarti.Models;

public class User : IdentityUser
{
    // IdentityUser already provides:
    //   Id (string, GUID format)    — primary key
    //   UserName                    — your "username" field
    //   NormalizedUserName          — indexed, used for case-insensitive lookup
    //   PasswordHash                — PBKDF2, managed by UserManager
    //   Email, NormalizedEmail      — available if you want to add email later

    public string FullName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;  // "male" | "female"
    public string ProfilePicture { get; set; } = string.Empty;

    public ICollection<Event> CreatedEvents { get; set; } = [];
    public ICollection<Booking> Bookings { get; set; } = [];
}