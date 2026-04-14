using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class AddContentEngagementStatsShowLastEpisodeAirDateAndBookVoteAverage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastEpisodeAirDate",
                table: "ShowMetadata",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "VoteAverage",
                table: "BookMetadata",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.CreateTable(
                name: "ContentEngagementStats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceType = table.Column<int>(type: "integer", nullable: false),
                    SourceId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ListCount = table.Column<int>(type: "integer", nullable: false),
                    ActiveCount = table.Column<int>(type: "integer", nullable: false),
                    CompletedCount = table.Column<int>(type: "integer", nullable: false),
                    PlannedCount = table.Column<int>(type: "integer", nullable: false),
                    DroppedCount = table.Column<int>(type: "integer", nullable: false),
                    OnHoldCount = table.Column<int>(type: "integer", nullable: false),
                    CompletionRate = table.Column<double>(type: "double precision", nullable: false),
                    LastAggregatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentEngagementStats", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContentEngagementStats_SourceType_SourceId",
                table: "ContentEngagementStats",
                columns: new[] { "SourceType", "SourceId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContentEngagementStats");

            migrationBuilder.DropColumn(
                name: "LastEpisodeAirDate",
                table: "ShowMetadata");

            migrationBuilder.DropColumn(
                name: "VoteAverage",
                table: "BookMetadata");
        }
    }
}
