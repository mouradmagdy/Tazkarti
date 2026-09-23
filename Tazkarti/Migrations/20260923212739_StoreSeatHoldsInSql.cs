using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tazkarti.Migrations
{
    /// <inheritdoc />
    public partial class StoreSeatHoldsInSql : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HeldByUserId",
                table: "EventSeats",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "HoldExpiresAt",
                table: "EventSeats",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventSeats_HoldExpiresAt",
                table: "EventSeats",
                column: "HoldExpiresAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventSeats_HoldExpiresAt",
                table: "EventSeats");

            migrationBuilder.DropColumn(
                name: "HeldByUserId",
                table: "EventSeats");

            migrationBuilder.DropColumn(
                name: "HoldExpiresAt",
                table: "EventSeats");
        }
    }
}
