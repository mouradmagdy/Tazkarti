using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using System.Text;
using Tazkarti.Data;
using Tazkarti.Middleware;
using Tazkarti.Models;
using Tazkarti.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Database ─────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")
    ,sql=>sql.CommandTimeout(360)));

// ── ASP.NET Identity ──────────────────────────────────────────────────────────
builder.Services.AddIdentity<User, IdentityRole>(opt =>
{
    // Password rules (mirrors your original 8-char minimum)
    opt.Password.RequiredLength = 8;
    opt.Password.RequireDigit = false;
    opt.Password.RequireUppercase = false;
    opt.Password.RequireNonAlphanumeric = false;

    // Lockout after 5 failed attempts for 5 minutes
    opt.Lockout.MaxFailedAccessAttempts = 5;
    opt.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);

    // Username allows any character (not just email-style)
    opt.User.AllowedUserNameCharacters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ── Redis ─────────────────────────────────────────────────────────────────────
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(
        builder.Configuration.GetConnectionString("Redis")!));

// ── Cloudinary ────────────────────────────────────────────────────────────────
var cloudSection = builder.Configuration.GetSection("Cloudinary");
builder.Services.AddSingleton(new Cloudinary(new Account(
    cloudSection["CloudName"],
    cloudSection["ApiKey"],
    cloudSection["ApiSecret"])));

// ── JWT (cookie-based, mirrors Node.js behaviour) ─────────────────────────────
var jwtKey = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("JWT secret not configured");

// Override Identity's default cookie auth scheme with JWT Bearer
builder.Services.AddAuthentication(opt =>
{
    opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(opt =>
{
    opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };

    // Read JWT from HttpOnly cookie
    opt.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            if (ctx.Request.Cookies.TryGetValue("jwt", out var token))
                ctx.Token = token;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(opt =>
    opt.AddPolicy("AdminOnly", p => p.RequireRole("admin")));

// ── Application services ──────────────────────────────────────────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<SeatLockService>();
builder.Services.AddScoped<VenueService>();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(opt =>
    opt.AddPolicy("FrontendPolicy", p => p
        .WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── Seed Identity roles on startup ────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    await db.Database.MigrateAsync();

    // Ensure roles exist
    foreach (var role in new[] { "admin", "user" })
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));

    // Seed a default admin user only when deployment supplies a password.
    var adminSection = config.GetSection("Seed:Admin");
    var adminUsername = adminSection["Username"] ?? "admin";
    var adminPassword = adminSection["Password"];

    if (!string.IsNullOrWhiteSpace(adminPassword) &&
        await userManager.FindByNameAsync(adminUsername) is null)
    {
        var admin = new User
        {
            UserName = adminUsername,
            FullName = adminSection["FullName"] ?? "Platform Admin",
            Gender = adminSection["Gender"] ?? "male",
            ProfilePicture = $"https://avatar.iran.liara.run/public/boy?username={adminUsername}"
        };

        var result = await userManager.CreateAsync(admin, adminPassword);
        if (!result.Succeeded)
            throw new Exception(
                $"Failed to seed admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");

        await userManager.AddToRoleAsync(admin, "admin");
    }

    await DemoDataSeeder.ResetEventsAsync(scope.ServiceProvider);
    if (config.GetValue<bool>("Seed:DemoData:ExitAfterReset"))
        return;
}

app.Run();
