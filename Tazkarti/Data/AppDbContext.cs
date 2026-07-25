using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Tazkarti.Models;

namespace Tazkarti.Data
{
    public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<User>(options)
    {
        public DbSet<Event> Events => Set<Event>();
        public DbSet<Booking> Bookings => Set<Booking>();
        public DbSet<Venue> Venues => Set<Venue>();
        public DbSet<Section> Sections => Set<Section>();
        public DbSet<Seat> Seats => Set<Seat>();
        public DbSet<EventSeat> EventSeats => Set<EventSeat>();
        public DbSet<BookingSeat> BookingSeats => Set<BookingSeat>();

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
                e.HasIndex(ev => ev.VenueId);

                e.Property(ev => ev.Name).HasMaxLength(100).IsRequired();
                e.Property(ev => ev.Description).HasMaxLength(1000).IsRequired();
                e.Property(ev => ev.Category).HasMaxLength(50).IsRequired();
                e.Property(ev => ev.Venue).HasMaxLength(100).IsRequired();
                e.Property(ev => ev.Price).HasColumnType("decimal(10,2)");

                e.HasOne(ev => ev.CreatedBy)
                 .WithMany(u => u.CreatedEvents)
                 .HasForeignKey(ev => ev.CreatedById)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(ev => ev.VenueLayout)
                 .WithMany(v => v.Events)
                 .HasForeignKey(ev => ev.VenueId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<Booking>(e =>
            {
                e.HasKey(bk => bk.Id);
                e.HasIndex(bk => bk.UserId);
                e.HasIndex(bk => bk.EventId);

                e.Property(bk => bk.Status)
                 .HasConversion(
                    status => status.ToString().ToLowerInvariant(),
                    value => Enum.Parse<BookingStatus>(value, true))
                 .HasMaxLength(20)
                 .HasDefaultValue(BookingStatus.Confirmed);

                e.HasOne(bk => bk.Event)
                 .WithMany(ev => ev.Bookings)
                 .HasForeignKey(bk => bk.EventId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(bk => bk.User)
                 .WithMany(u => u.Bookings)
                 .HasForeignKey(bk => bk.UserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<Venue>(e =>
            {
                e.HasKey(v => v.Id);
                e.HasIndex(v => v.Name);

                e.Property(v => v.Name).HasMaxLength(100).IsRequired();
                e.Property(v => v.Address).HasMaxLength(200);
            });

            builder.Entity<Section>(e =>
            {
                e.HasKey(s => s.Id);
                e.HasIndex(s => new { s.VenueId, s.Name }).IsUnique();

                e.Property(s => s.Name).HasMaxLength(60).IsRequired();
                e.Property(s => s.Color).HasMaxLength(20);

                e.HasOne(s => s.Venue)
                 .WithMany(v => v.Sections)
                 .HasForeignKey(s => s.VenueId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<Seat>(e =>
            {
                e.HasKey(s => s.Id);
                e.HasIndex(s => new { s.SectionId, s.Label }).IsUnique();
                e.HasIndex(s => new { s.SectionId, s.Row, s.Number }).IsUnique();

                e.Property(s => s.Row).HasMaxLength(20).IsRequired();
                e.Property(s => s.Number).HasMaxLength(20).IsRequired();
                e.Property(s => s.Label).HasMaxLength(30).IsRequired();
                e.Property(s => s.X).HasColumnType("decimal(8,2)");
                e.Property(s => s.Y).HasColumnType("decimal(8,2)");

                e.HasOne(s => s.Section)
                 .WithMany(sec => sec.Seats)
                 .HasForeignKey(s => s.SectionId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<EventSeat>(e =>
            {
                e.HasKey(es => es.Id);
                e.HasIndex(es => new { es.EventId, es.SeatId }).IsUnique();
                e.HasIndex(es => new { es.EventId, es.Status });
                e.HasIndex(es => es.SeatId);

                e.Property(es => es.Price).HasColumnType("decimal(10,2)");
                e.Property(es => es.Status)
                 .HasConversion(
                    status => status.ToString().ToLowerInvariant(),
                    value => Enum.Parse<EventSeatStatus>(value, true))
                 .HasMaxLength(20)
                 .HasDefaultValue(EventSeatStatus.Available);

                e.HasOne(es => es.Event)
                 .WithMany(ev => ev.EventSeats)
                 .HasForeignKey(es => es.EventId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(es => es.Seat)
                 .WithMany(s => s.EventSeats)
                 .HasForeignKey(es => es.SeatId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<BookingSeat>(e =>
            {
                e.HasKey(bs => bs.Id);
                e.HasIndex(bs => bs.BookingId);
                e.HasIndex(bs => bs.EventSeatId).IsUnique();

                e.Property(bs => bs.Price).HasColumnType("decimal(10,2)");

                e.HasOne(bs => bs.Booking)
                 .WithMany(b => b.Seats)
                 .HasForeignKey(bs => bs.BookingId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(bs => bs.EventSeat)
                 .WithMany(es => es.BookingSeats)
                 .HasForeignKey(bs => bs.EventSeatId)
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
            foreach (var entry in ChangeTracker.Entries<Venue>())
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            return base.SaveChangesAsync(ct);
        }
    }
}
