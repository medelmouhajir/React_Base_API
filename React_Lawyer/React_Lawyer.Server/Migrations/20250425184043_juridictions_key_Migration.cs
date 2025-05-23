using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Lawyer.Server.Migrations
{
    /// <inheritdoc />
    public partial class juridictions_key_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "JuridictionId",
                table: "Cases",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cases_JuridictionId",
                table: "Cases",
                column: "JuridictionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_Juridictions_JuridictionId",
                table: "Cases",
                column: "JuridictionId",
                principalTable: "Juridictions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cases_Juridictions_JuridictionId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_JuridictionId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "JuridictionId",
                table: "Cases");
        }
    }
}
