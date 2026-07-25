namespace Tazkarti.Dtos.Bookings
{
    public class LockResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public int ExpiresInSeconds { get; set; }
    }
}
