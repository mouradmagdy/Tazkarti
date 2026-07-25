using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tazkarti.Migrations
{
    /// <inheritdoc />
    public partial class Addindecies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Events_Category",
                table: "Events",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Events_Category_Date",
                table: "Events",
                columns: new[] { "Category", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Events_Date",
                table: "Events",
                column: "Date");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Events_Category",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_Category_Date",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_Date",
                table: "Events");
        }
    }
}
