using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Tazkarti.DTOs.Auth;
using Tazkarti.Helpers;
using Tazkarti.Models;

namespace Tazkarti.Services
{
    public class AuthService(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config)
    {
        public async Task<UserResponseDto> SignupAsync(SignupDto dto, string? callerRole)
        {
            if (dto.Password != dto.ConfirmPassword)
                throw new BadRequestException("Passwords do not match");

            if (dto.Role == "admin" && callerRole != "admin")
                throw new ForbiddenException("Only admins can create admin accounts");

            var profilePic = dto.Gender == "male"
                ? $"https://avatar.iran.liara.run/public/boy?username={dto.Username}"
                : $"https://avatar.iran.liara.run/public/girl?username={dto.Username}";

            var user = new User
            {
                UserName = dto.Username,
                FullName = dto.FullName,
                Gender = dto.Gender,
                ProfilePicture = profilePic
            };

            var result = await userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new BadRequestException(errors);
            }

            // Assign role via Identity's role system
            await userManager.AddToRoleAsync(user, dto.Role == "admin" ? "admin" : "user");

            return ToDto(user, dto.Role == "admin" ? "admin" : "user");
        }

        public async Task<(UserResponseDto Dto, string Token)> LoginAsync(LoginDto dto)
        {
            var user = await userManager.FindByNameAsync(dto.Username);

            if (user is null)
                throw new BadRequestException("Username or password is incorrect");

            // CheckPasswordSignInAsync is timing-attack-safe and handles lockout
            var result = await signInManager.CheckPasswordSignInAsync(
                user, dto.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                var msg = result.IsLockedOut
                    ? "Account locked. Try again later."
                    : "Username or password is incorrect";
                throw new BadRequestException(msg);
            }

            var roles = await userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "user";
            var token = GenerateToken(user, role);

            return (ToDto(user, role), token);
        }

        public async Task<UserResponseDto> GetCurrentUserAsync(string userId)
        {
            var user = await userManager.FindByIdAsync(userId)
                ?? throw new NotFoundException("User not found");

            var roles = await userManager.GetRolesAsync(user);
            return ToDto(user, roles.FirstOrDefault() ?? "user");
        }

        public string GenerateToken(User user, string role)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name,           user.UserName!),
            new Claim(ClaimTypes.Role,            role)
        };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(15),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static UserResponseDto ToDto(User u, string role) => new()
        {
            Id = u.Id,
            FullName = u.FullName,
            Username = u.UserName!,
            ProfilePicture = u.ProfilePicture,
            Role = role,
            Gender = u.Gender
        };
    }
}

