using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Tazkarti.Models;

namespace Tazkarti.Data
{
    public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<User>(options)
    {
        public DbSet<Event> Events => Set<Event>();
        public DbSet<Booking> Bookings => Set<Booking>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<User>(e =>
            {
                e.Property(u => u.FullName).HasMaxLength(100).IsRequired();
                e.Property(u => u.Gender).HasMaxLength(10).IsRequired();
                e.Property(u => u.ProfilePicture).HasMaxLength(255);
            });

            builder.Entity<Event>(e =>
            {
                e.HasKey(ev => ev.Id);
                e.HasIndex(ev => new { ev.Category, ev.Date }) // composite
                 .HasDatabaseName("IX_Events_Category_Date");
                e.HasIndex(ev => ev.Category);
                e.HasIndex(ev => ev.Date);
                e.HasIndex(ev => ev.CreatedById);

                e.Property(ev => ev.Name).HasMaxLength(100).IsRequired();
                e.Property(ev => ev.Description).HasMaxLength(1000).IsRequired();
                e.Property(ev => ev.Category).HasMaxLength(50).IsRequired();
                e.Property(ev => ev.Venue).HasMaxLength(100).IsRequired();
                e.Property(ev => ev.Price).HasColumnType("decimal(10,2)");

                e.HasOne(ev => ev.CreatedBy)
                 .WithMany(u => u.CreatedEvents)
                 .HasForeignKey(ev => ev.CreatedById)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<Booking>(e =>
            {
                e.HasKey(bk => bk.Id);
                e.HasIndex(bk => bk.UserId);
                e.HasIndex(bk => bk.EventId);
                e.HasIndex(bk => new { bk.EventId, bk.UserId }).IsUnique(); // no double-booking

                e.Property(bk => bk.Status).HasMaxLength(20).HasDefaultValue("confirmed"); // change to enum

                e.HasOne(bk => bk.Event)
                 .WithMany(ev => ev.Bookings)
                 .HasForeignKey(bk => bk.EventId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(bk => bk.User)
                 .WithMany(u => u.Bookings)
                 .HasForeignKey(bk => bk.UserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });
        }

        public override Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            foreach (var entry in ChangeTracker.Entries<Event>())
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            return base.SaveChangesAsync(ct);
        }
    }
}
