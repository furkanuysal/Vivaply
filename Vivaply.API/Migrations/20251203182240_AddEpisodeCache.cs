using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEpisodeCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LatestEpisodeInfo",
                table: "UserShows",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NextAirDate",
                table: "UserShows",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LatestEpisodeInfo",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "NextAirDate",
                table: "UserShows");
        }
    }
}
