using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Lawyer.Server.Migrations
{
    /// <inheritdoc />
    public partial class remove_courtName_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CourtName",
                table: "Cases");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CourtName",
                table: "Cases",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
