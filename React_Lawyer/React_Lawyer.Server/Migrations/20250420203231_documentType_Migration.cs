using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Lawyer.Server.Migrations
{
    /// <inheritdoc />
    public partial class documentType_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Documents",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Documents");
        }
    }
}
