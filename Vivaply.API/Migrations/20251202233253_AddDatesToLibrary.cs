using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDatesToLibrary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FirstAirDate",
                table: "UserShows",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReleaseDate",
                table: "UserMovies",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstAirDate",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "ReleaseDate",
                table: "UserMovies");
        }
    }
}
