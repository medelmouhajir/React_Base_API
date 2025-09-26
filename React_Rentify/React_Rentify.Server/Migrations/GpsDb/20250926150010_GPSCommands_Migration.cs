using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Rentify.Server.Migrations.GpsDb
{
    /// <inheritdoc />
    public partial class GPSCommands_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IMEI",
                table: "Gps_Devices",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CommandQueues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommandType = table.Column<int>(type: "integer", nullable: false),
                    CommandData = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RequestedBy = table.Column<string>(type: "text", nullable: true),
                    Result = table.Column<string>(type: "text", nullable: true),
                    Gps_DeviceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommandQueues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommandQueues_Gps_Devices_Gps_DeviceId",
                        column: x => x.Gps_DeviceId,
                        principalTable: "Gps_Devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommandQueues_Gps_DeviceId",
                table: "CommandQueues",
                column: "Gps_DeviceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommandQueues");

            migrationBuilder.DropColumn(
                name: "IMEI",
                table: "Gps_Devices");
        }
    }
}
