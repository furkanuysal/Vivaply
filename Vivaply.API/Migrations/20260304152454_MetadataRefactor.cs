using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class MetadataRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserShows_UserId",
                table: "UserShows");

            migrationBuilder.DropIndex(
                name: "IX_UserMovies_UserId",
                table: "UserMovies");

            migrationBuilder.DropIndex(
                name: "IX_UserGames_UserId",
                table: "UserGames");

            migrationBuilder.DropIndex(
                name: "IX_UserBooks_UserId",
                table: "UserBooks");

            migrationBuilder.DropIndex(
                name: "IX_ShowMetadata_TmdbShowId",
                table: "ShowMetadata");

            migrationBuilder.DropIndex(
                name: "IX_MovieMetadata_TmdbMovieId",
                table: "MovieMetadata");

            migrationBuilder.DropIndex(
                name: "IX_GameMetadata_IgdbId",
                table: "GameMetadata");

            migrationBuilder.DropIndex(
                name: "IX_BookMetadata_GoogleBookId",
                table: "BookMetadata");

            migrationBuilder.DropColumn(
                name: "FirstAirDate",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "GenresJson",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "LatestEpisodeInfo",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "NextAirDate",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "PosterPath",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "ProductionStatus",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "ShowName",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "VoteAverage",
                table: "UserShows");

            migrationBuilder.DropColumn(
                name: "GenresJson",
                table: "UserMovies");

            migrationBuilder.DropColumn(
                name: "PosterPath",
                table: "UserMovies");

            migrationBuilder.DropColumn(
                name: "ProductionStatus",
                table: "UserMovies");

            migrationBuilder.DropColumn(
                name: "ReleaseDate",
                table: "UserMovies");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "UserMovies");

            migrationBuilder.DropColumn(
                name: "VoteAverage",
                table: "UserMovies");

            migrationBuilder.DropColumn(
                name: "CoverUrl",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "Developers",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "Genres",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "Platforms",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "ReleaseDate",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "VoteAverage",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "Authors",
                table: "UserBooks");

            migrationBuilder.DropColumn(
                name: "CoverUrl",
                table: "UserBooks");

            migrationBuilder.DropColumn(
                name: "PageCount",
                table: "UserBooks");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "UserBooks");

            migrationBuilder.CreateIndex(
                name: "IX_UserShows_TmdbShowId",
                table: "UserShows",
                column: "TmdbShowId");

            migrationBuilder.CreateIndex(
                name: "IX_UserShows_UserId_TmdbShowId",
                table: "UserShows",
                columns: new[] { "UserId", "TmdbShowId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserMovies_TmdbMovieId",
                table: "UserMovies",
                column: "TmdbMovieId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMovies_UserId_TmdbMovieId",
                table: "UserMovies",
                columns: new[] { "UserId", "TmdbMovieId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserGames_IgdbId",
                table: "UserGames",
                column: "IgdbId");

            migrationBuilder.CreateIndex(
                name: "IX_UserGames_UserId_IgdbId",
                table: "UserGames",
                columns: new[] { "UserId", "IgdbId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserBooks_GoogleBookId",
                table: "UserBooks",
                column: "GoogleBookId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBooks_UserId_GoogleBookId",
                table: "UserBooks",
                columns: new[] { "UserId", "GoogleBookId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_UserBooks_BookMetadata_GoogleBookId",
                table: "UserBooks",
                column: "GoogleBookId",
                principalTable: "BookMetadata",
                principalColumn: "GoogleBookId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserGames_GameMetadata_IgdbId",
                table: "UserGames",
                column: "IgdbId",
                principalTable: "GameMetadata",
                principalColumn: "IgdbId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserMovies_MovieMetadata_TmdbMovieId",
                table: "UserMovies",
                column: "TmdbMovieId",
                principalTable: "MovieMetadata",
                principalColumn: "TmdbMovieId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserShows_ShowMetadata_TmdbShowId",
                table: "UserShows",
                column: "TmdbShowId",
                principalTable: "ShowMetadata",
                principalColumn: "TmdbShowId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserBooks_BookMetadata_GoogleBookId",
                table: "UserBooks");

            migrationBuilder.DropForeignKey(
                name: "FK_UserGames_GameMetadata_IgdbId",
                table: "UserGames");

            migrationBuilder.DropForeignKey(
                name: "FK_UserMovies_MovieMetadata_TmdbMovieId",
                table: "UserMovies");

            migrationBuilder.DropForeignKey(
                name: "FK_UserShows_ShowMetadata_TmdbShowId",
                table: "UserShows");

            migrationBuilder.DropIndex(
                name: "IX_UserShows_TmdbShowId",
                table: "UserShows");

            migrationBuilder.DropIndex(
                name: "IX_UserShows_UserId_TmdbShowId",
                table: "UserShows");

            migrationBuilder.DropIndex(
                name: "IX_UserMovies_TmdbMovieId",
                table: "UserMovies");

            migrationBuilder.DropIndex(
                name: "IX_UserMovies_UserId_TmdbMovieId",
                table: "UserMovies");

            migrationBuilder.DropIndex(
                name: "IX_UserGames_IgdbId",
                table: "UserGames");

            migrationBuilder.DropIndex(
                name: "IX_UserGames_UserId_IgdbId",
                table: "UserGames");

            migrationBuilder.DropIndex(
                name: "IX_UserBooks_GoogleBookId",
                table: "UserBooks");

            migrationBuilder.DropIndex(
                name: "IX_UserBooks_UserId_GoogleBookId",
                table: "UserBooks");

            migrationBuilder.AddColumn<string>(
                name: "FirstAirDate",
                table: "UserShows",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GenresJson",
                table: "UserShows",
                type: "jsonb",
                nullable: true);

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

            migrationBuilder.AddColumn<string>(
                name: "PosterPath",
                table: "UserShows",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductionStatus",
                table: "UserShows",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShowName",
                table: "UserShows",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "VoteAverage",
                table: "UserShows",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "GenresJson",
                table: "UserMovies",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PosterPath",
                table: "UserMovies",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductionStatus",
                table: "UserMovies",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReleaseDate",
                table: "UserMovies",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "UserMovies",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "VoteAverage",
                table: "UserMovies",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "CoverUrl",
                table: "UserGames",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Developers",
                table: "UserGames",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Genres",
                table: "UserGames",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Platforms",
                table: "UserGames",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReleaseDate",
                table: "UserGames",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "UserGames",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "VoteAverage",
                table: "UserGames",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "Authors",
                table: "UserBooks",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CoverUrl",
                table: "UserBooks",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PageCount",
                table: "UserBooks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "UserBooks",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_UserShows_UserId",
                table: "UserShows",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMovies_UserId",
                table: "UserMovies",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserGames_UserId",
                table: "UserGames",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBooks_UserId",
                table: "UserBooks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowMetadata_TmdbShowId",
                table: "ShowMetadata",
                column: "TmdbShowId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieMetadata_TmdbMovieId",
                table: "MovieMetadata",
                column: "TmdbMovieId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GameMetadata_IgdbId",
                table: "GameMetadata",
                column: "IgdbId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookMetadata_GoogleBookId",
                table: "BookMetadata",
                column: "GoogleBookId",
                unique: true);
        }
    }
}
