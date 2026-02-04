using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGenresToUserMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GenresJson",
                table: "UserShows",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GenresJson",
                table: "UserMovies",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GenresJson",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "GenresJson",
                table: "UserMovies");
        }
    }
}
