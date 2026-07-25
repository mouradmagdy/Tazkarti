using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tazkarti.Models;

namespace Tazkarti.Data;

public static class DemoDataSeeder
{
    private static readonly HashSet<string> ResetTableNames =
    [
        "BookingSeats",
        "Bookings",
        "EventSeats",
        "Events",
        "Seats",
        "Sections",
        "Venues"
    ];

    public static async Task ResetEventsAsync(IServiceProvider services)
    {
        var config = services.GetRequiredService<IConfiguration>();
        if (!config.GetValue<bool>("Seed:DemoData:ResetEvents"))
            return;

        var db = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<User>>();
        var logger = services.GetRequiredService<ILoggerFactory>()
            .CreateLogger("DemoDataSeeder");

        var admins = await userManager.GetUsersInRoleAsync("admin");
        var owner = admins.FirstOrDefault() ?? await db.Users.FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("Cannot seed demo events without at least one user.");

        await PrepareDatabaseForResetAsync(db, logger);
        await DeleteTableInBatchesAsync(db, "BookingSeats", logger);
        await DeleteTableInBatchesAsync(db, "Bookings", logger);
        await DeleteTableInBatchesAsync(db, "EventSeats", logger);
        await DeleteTableInBatchesAsync(db, "Events", logger);
        await DeleteTableInBatchesAsync(db, "Seats", logger);
        await DeleteTableInBatchesAsync(db, "Sections", logger);
        await DeleteTableInBatchesAsync(db, "Venues", logger);

        var venues = BuildVenues();
        db.Venues.AddRange(venues);
        await db.SaveChangesAsync();

        var events = BuildEvents(venues, owner.Id);
        var seatsByVenue = await db.Seats
            .Select(seat => new
            {
                SeatId = seat.Id,
                VenueId = seat.Section.VenueId,
                SectionName = seat.Section.Name
            })
            .ToListAsync();

        foreach (var ev in events)
        {
            var seatCount = seatsByVenue.Count(seat => seat.VenueId == ev.VenueId);
            ev.TotalSeats = seatCount;
            ev.AvailableSeats = seatCount;
        }

        db.Events.AddRange(events);
        await db.SaveChangesAsync();

        var eventSeats = new List<EventSeat>();
        foreach (var ev in events)
        {
            foreach (var seat in seatsByVenue.Where(seat => seat.VenueId == ev.VenueId))
            {
                eventSeats.Add(new EventSeat
                {
                    EventId = ev.Id,
                    SeatId = seat.SeatId,
                    Price = PriceForSection(ev.Price, seat.SectionName),
                    Status = EventSeatStatus.Available
                });
            }
        }

        db.EventSeats.AddRange(eventSeats);
        await db.SaveChangesAsync();
        logger.LogInformation("Demo event data reset. Seeded {EventCount} events.", events.Count);
    }

    private static async Task PrepareDatabaseForResetAsync(AppDbContext db, ILogger logger)
    {
        var databaseName = db.Database.GetDbConnection().Database.Replace("]", "]]");
        try
        {
            await db.Database.ExecuteSqlRawAsync(
                "ALTER DATABASE [" + databaseName + "] SET RECOVERY SIMPLE WITH NO_WAIT;");
            await db.Database.ExecuteSqlRawAsync("CHECKPOINT;");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not switch database recovery mode before demo reset.");
        }
    }

    private static async Task DeleteTableInBatchesAsync(
        AppDbContext db,
        string tableName,
        ILogger logger)
    {
        const int batchSize = 10000;
        if (!ResetTableNames.Contains(tableName))
            throw new InvalidOperationException($"Unexpected reset table: {tableName}");

        var safeTableName = tableName.Replace("]", "]]");
        var deletedTotal = 0;

        while (true)
        {
            var deleted = await db.Database.ExecuteSqlRawAsync(
                "DELETE TOP (" + batchSize + ") FROM [" + safeTableName + "];");

            if (deleted <= 0)
                break;

            deletedTotal += deleted;
            await db.Database.ExecuteSqlRawAsync("CHECKPOINT;");
        }

        logger.LogInformation("Deleted {RowCount} rows from {TableName}.", deletedTotal, tableName);
    }

    private static List<Venue> BuildVenues()
        =>
        [
            new Venue
            {
                Name = "Nile Arena",
                Address = "Zamalek, Cairo",
                Sections =
                [
                    BuildSection("Floor", 0, "#16a34a", 5, 12, 110, 105),
                    BuildSection("Lower Bowl", 1, "#2563eb", 4, 14, 95, 285),
                    BuildSection("VIP", 2, "#7c3aed", 3, 8, 285, 435, accessibleEvery: 4)
                ]
            },
            new Venue
            {
                Name = "Alexandria Open Air",
                Address = "Corniche, Alexandria",
                Sections =
                [
                    BuildSection("Main Deck", 0, "#0891b2", 5, 10, 150, 130),
                    BuildSection("Terrace", 1, "#ea580c", 4, 12, 120, 330, accessibleEvery: 6)
                ]
            },
            new Venue
            {
                Name = "Cairo Tech Hall",
                Address = "New Cairo",
                Sections =
                [
                    BuildSection("Auditorium", 0, "#4f46e5", 6, 13, 110, 105),
                    BuildSection("Balcony", 1, "#9333ea", 4, 11, 145, 350)
                ]
            }
        ];

    private static List<Event> BuildEvents(List<Venue> venues, string ownerId)
    {
        var now = DateTime.UtcNow.Date;
        var nileArena = venues.Single(v => v.Name == "Nile Arena");
        var alexOpenAir = venues.Single(v => v.Name == "Alexandria Open Air");
        var techHall = venues.Single(v => v.Name == "Cairo Tech Hall");

        return
        [
            BuildEvent(
                "Cairo Indie Night",
                "music",
                "A live indie showcase with three rising bands, reserved seating, and late-night food vendors.",
                nileArena,
                35,
                now.AddDays(10).AddHours(19),
                "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
                ownerId),
            BuildEvent(
                "AI Product Summit",
                "technology",
                "A practical conference for product builders covering AI workflows, demos, and founder panels.",
                techHall,
                120,
                now.AddDays(21).AddHours(10),
                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
                ownerId),
            BuildEvent(
                "Alexandria Derby Watch Party",
                "sports",
                "A premium seated watch party with giant screens, live commentary, and fan-zone activities.",
                alexOpenAir,
                45,
                now.AddDays(32).AddHours(20),
                "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
                ownerId),
            BuildEvent(
                "Modern Art After Dark",
                "art",
                "An evening exhibition featuring digital installations, guided talks, and reserved gallery seating.",
                nileArena,
                30,
                now.AddDays(46).AddHours(18),
                "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1200&q=80",
                ownerId),
            BuildEvent(
                "Startup Demo Day",
                "technology",
                "Early-stage teams pitch new products to investors, operators, and engineers in a seated auditorium.",
                techHall,
                75,
                now.AddDays(63).AddHours(13),
                "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
                ownerId),
            BuildEvent(
                "Jazz on the Corniche",
                "music",
                "A waterfront jazz session with reserved terrace seating and sunset views over Alexandria.",
                alexOpenAir,
                55,
                now.AddDays(92).AddHours(19),
                "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80",
                ownerId)
        ];
    }

    private static Event BuildEvent(
        string name,
        string category,
        string description,
        Venue venue,
        decimal price,
        DateTime date,
        string image,
        string ownerId)
        => new()
        {
            Name = name,
            Category = category,
            Description = description,
            Venue = venue.Name,
            VenueId = venue.Id,
            Price = price,
            Date = date,
            Image = image,
            CreatedById = ownerId
        };

    private static Section BuildSection(
        string name,
        int displayOrder,
        string color,
        int rows,
        int seatsPerRow,
        decimal startX,
        decimal startY,
        int accessibleEvery = 0)
    {
        var section = new Section
        {
            Name = name,
            DisplayOrder = displayOrder,
            Color = color
        };

        for (var rowIndex = 0; rowIndex < rows; rowIndex++)
        {
            var row = ((char)('A' + rowIndex)).ToString();
            for (var seatIndex = 1; seatIndex <= seatsPerRow; seatIndex++)
            {
                section.Seats.Add(new Seat
                {
                    Row = row,
                    Number = seatIndex.ToString(),
                    Label = $"{row}-{seatIndex}",
                    X = startX + ((seatIndex - 1) * 34),
                    Y = startY + (rowIndex * 34),
                    IsAccessible = accessibleEvery > 0 && rowIndex == rows - 1 && seatIndex % accessibleEvery == 0
                });
            }
        }

        return section;
    }

    private static decimal PriceForSection(decimal basePrice, string sectionName)
        => sectionName.ToLowerInvariant() switch
        {
            var name when name.Contains("vip") => decimal.Round(basePrice * 1.8m, 2),
            var name when name.Contains("balcony") => decimal.Round(basePrice * 0.85m, 2),
            var name when name.Contains("terrace") => decimal.Round(basePrice * 1.25m, 2),
            var name when name.Contains("floor") => decimal.Round(basePrice * 1.15m, 2),
            _ => basePrice
        };
}
