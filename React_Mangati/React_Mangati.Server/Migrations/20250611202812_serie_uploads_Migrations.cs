using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Mangati.Server.Migrations
{
    /// <inheritdoc />
    public partial class serie_uploads_Migrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Serie_Uploads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Path = table.Column<string>(type: "text", nullable: false),
                    Date_Uploaded = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SerieId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Serie_Uploads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Serie_Uploads_Series_SerieId",
                        column: x => x.SerieId,
                        principalTable: "Series",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Serie_Uploads_SerieId",
                table: "Serie_Uploads",
                column: "SerieId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Serie_Uploads");
        }
    }
}
