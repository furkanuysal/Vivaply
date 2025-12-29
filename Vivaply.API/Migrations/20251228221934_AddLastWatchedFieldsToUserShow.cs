using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLastWatchedFieldsToUserShow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastWatchedAt",
                table: "UserShows",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LastWatchedEpisode",
                table: "UserShows",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LastWatchedSeason",
                table: "UserShows",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastWatchedAt",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "LastWatchedEpisode",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "LastWatchedSeason",
                table: "UserShows");
        }
    }
}
