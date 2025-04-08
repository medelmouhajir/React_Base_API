using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Lawyer.Server.Migrations
{
    /// <inheritdoc />
    public partial class document_LawFirmId_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LawFirmId",
                table: "Documents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_LawFirmId",
                table: "Documents",
                column: "LawFirmId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_LawFirms_LawFirmId",
                table: "Documents",
                column: "LawFirmId",
                principalTable: "LawFirms",
                principalColumn: "LawFirmId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_LawFirms_LawFirmId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_LawFirmId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "LawFirmId",
                table: "Documents");
        }
    }
}
