using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class AddVoteAverageToLibrary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "VoteAverage",
                table: "UserShows",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "VoteAverage",
                table: "UserMovies",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VoteAverage",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "VoteAverage",
                table: "UserMovies");
        }
    }
}
