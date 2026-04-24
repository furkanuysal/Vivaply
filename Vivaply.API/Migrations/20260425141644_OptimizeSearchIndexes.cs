using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class OptimizeSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,");

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_Users_Username_Trgm"
                ON "Users" USING gin ("Username" gin_trgm_ops);
                """);

            migrationBuilder.CreateIndex(
                name: "IX_UserPosts_TextContent",
                table: "UserPosts",
                column: "TextContent")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:TsVectorConfig", "simple");

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_UserPosts_TextContent_Trgm"
                ON "UserPosts" USING gin (lower("TextContent") gin_trgm_ops)
                WHERE "TextContent" IS NOT NULL AND "TextContent" <> '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_UserPosts_TextContent_Trgm";
                """);

            migrationBuilder.DropIndex(
                name: "IX_UserPosts_TextContent",
                table: "UserPosts");

            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_Users_Username_Trgm";
                """);

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,");
        }
    }
}
