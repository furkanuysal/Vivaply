using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMetadataTablesOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookMetadata",
                columns: table => new
                {
                    GoogleBookId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AuthorsJson = table.Column<string>(type: "jsonb", nullable: true),
                    CoverUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PageCount = table.Column<int>(type: "integer", nullable: false),
                    LastFetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookMetadata", x => x.GoogleBookId);
                });

            migrationBuilder.CreateTable(
                name: "GameMetadata",
                columns: table => new
                {
                    IgdbId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CoverUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PlatformsJson = table.Column<string>(type: "jsonb", nullable: true),
                    DevelopersJson = table.Column<string>(type: "jsonb", nullable: true),
                    GenresJson = table.Column<string>(type: "jsonb", nullable: true),
                    VoteAverage = table.Column<double>(type: "double precision", nullable: false),
                    LastFetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameMetadata", x => x.IgdbId);
                });

            migrationBuilder.CreateTable(
                name: "MovieMetadata",
                columns: table => new
                {
                    TmdbMovieId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PosterPath = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    VoteAverage = table.Column<double>(type: "double precision", nullable: false),
                    ProductionStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    GenresJson = table.Column<string>(type: "jsonb", nullable: true),
                    LastFetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieMetadata", x => x.TmdbMovieId);
                });

            migrationBuilder.CreateTable(
                name: "ShowMetadata",
                columns: table => new
                {
                    TmdbShowId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PosterPath = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    VoteAverage = table.Column<double>(type: "double precision", nullable: false),
                    ProductionStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FirstAirDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastKnownSeason = table.Column<int>(type: "integer", nullable: true),
                    LastKnownEpisode = table.Column<int>(type: "integer", nullable: true),
                    NextEpisodeAirDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    GenresJson = table.Column<string>(type: "text", nullable: true),
                    LastFetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowMetadata", x => x.TmdbShowId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookMetadata_GoogleBookId",
                table: "BookMetadata",
                column: "GoogleBookId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GameMetadata_IgdbId",
                table: "GameMetadata",
                column: "IgdbId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieMetadata_TmdbMovieId",
                table: "MovieMetadata",
                column: "TmdbMovieId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShowMetadata_TmdbShowId",
                table: "ShowMetadata",
                column: "TmdbShowId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookMetadata");

            migrationBuilder.DropTable(
                name: "GameMetadata");

            migrationBuilder.DropTable(
                name: "MovieMetadata");

            migrationBuilder.DropTable(
                name: "ShowMetadata");
        }
    }
}
