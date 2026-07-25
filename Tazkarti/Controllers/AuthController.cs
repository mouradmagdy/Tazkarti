using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tazkarti.DTOs.Auth;
using Tazkarti.Services;

namespace Tazkarti.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    // POST /api/auth/signup
    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupDto dto)
    {
        var callerRole = User.FindFirstValue(ClaimTypes.Role);
        var (user, token) = await authService.SignupAsync(dto, callerRole);
        AppendAuthCookie(token);
        return StatusCode(201, user);
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var (userDto, token) = await authService.LoginAsync(dto);

        AppendAuthCookie(token);

        return Ok(userDto);
    }

    // POST /api/auth/logout
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("jwt", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/"
        });
        return Ok(new { message = "Logged out successfully" });
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        // IdentityUser.Id is a string — no Guid.Parse needed
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await authService.GetCurrentUserAsync(userId);
        return Ok(user);
    }

    private void AppendAuthCookie(string token)
    {
        Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddDays(15),
            Path = "/"
        });
    }
}
