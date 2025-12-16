using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateGamesModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompletionType",
                table: "UserGames",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UserPlatform",
                table: "UserGames",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "UserPlaytime",
                table: "UserGames",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletionType",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "UserPlatform",
                table: "UserGames");

            migrationBuilder.DropColumn(
                name: "UserPlaytime",
                table: "UserGames");
        }
    }
}
