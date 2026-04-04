using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vivaply.API.Migrations
{
    /// <inheritdoc />
    public partial class RefactorActivitiesAndAddPosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IncludeInFeed",
                table: "UserActivities");

            migrationBuilder.DropColumn(
                name: "Visibility",
                table: "UserActivities");

            migrationBuilder.CreateTable(
                name: "UserPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uuid", nullable: true),
                    ParentPostId = table.Column<Guid>(type: "uuid", nullable: true),
                    QuotedPostId = table.Column<Guid>(type: "uuid", nullable: true),
                    TextContent = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPosts_UserActivities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "UserActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserPosts_UserPosts_ParentPostId",
                        column: x => x.ParentPostId,
                        principalTable: "UserPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserPosts_UserPosts_QuotedPostId",
                        column: x => x.QuotedPostId,
                        principalTable: "UserPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserPosts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PostAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Width = table.Column<int>(type: "integer", nullable: true),
                    Height = table.Column<int>(type: "integer", nullable: true),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostAttachments_UserPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "UserPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostAttachments_PostId_SortOrder",
                table: "PostAttachments",
                columns: new[] { "PostId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_UserPosts_ActivityId",
                table: "UserPosts",
                column: "ActivityId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserPosts_ParentPostId",
                table: "UserPosts",
                column: "ParentPostId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPosts_PublishedAt",
                table: "UserPosts",
                column: "PublishedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserPosts_QuotedPostId",
                table: "UserPosts",
                column: "QuotedPostId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPosts_UserId_PublishedAt",
                table: "UserPosts",
                columns: new[] { "UserId", "PublishedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PostAttachments");

            migrationBuilder.DropTable(
                name: "UserPosts");

            migrationBuilder.AddColumn<bool>(
                name: "IncludeInFeed",
                table: "UserActivities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Visibility",
                table: "UserActivities",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
