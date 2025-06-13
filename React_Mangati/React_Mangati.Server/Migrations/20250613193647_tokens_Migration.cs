using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Mangati.Server.Migrations
{
    /// <inheritdoc />
    public partial class tokens_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Image_Generations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Date_Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Date_Completed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Prompt = table.Column<string>(type: "text", nullable: false),
                    Result_Path = table.Column<string>(type: "text", nullable: true),
                    Tokens = table.Column<int>(type: "integer", nullable: false),
                    SerieId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Image_Generations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Image_Generations_Series_SerieId",
                        column: x => x.SerieId,
                        principalTable: "Series",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Image_Generation_References",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Extra_Id_1 = table.Column<int>(type: "integer", nullable: false),
                    Extra_Id_2 = table.Column<Guid>(type: "uuid", nullable: false),
                    Image_GenerationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Image_Generation_References", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Image_Generation_References_Image_Generations_Image_Generat~",
                        column: x => x.Image_GenerationId,
                        principalTable: "Image_Generations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Image_Generation_References_Image_GenerationId",
                table: "Image_Generation_References",
                column: "Image_GenerationId");

            migrationBuilder.CreateIndex(
                name: "IX_Image_Generations_SerieId",
                table: "Image_Generations",
                column: "SerieId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Image_Generation_References");

            migrationBuilder.DropTable(
                name: "Image_Generations");
        }
    }
}
