using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Rentify.Server.Migrations.GpsDb
{
    /// <inheritdoc />
    public partial class alerts_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Speeding_Alerts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Gps_DeviceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Location_RecordId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeviceSerialNumber = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    ActualSpeedKmh = table.Column<double>(type: "double precision", nullable: false),
                    SpeedLimitKmh = table.Column<int>(type: "integer", nullable: false),
                    ExceededByKmh = table.Column<double>(type: "double precision", nullable: false),
                    ExceededByPercentage = table.Column<double>(type: "double precision", nullable: false),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    IsAcknowledged = table.Column<bool>(type: "boolean", nullable: false),
                    AcknowledgedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AcknowledgedBy = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Speeding_Alerts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Speeding_Alerts_Gps_Devices_Gps_DeviceId",
                        column: x => x.Gps_DeviceId,
                        principalTable: "Gps_Devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Speeding_Alerts_Location_Records_Location_RecordId",
                        column: x => x.Location_RecordId,
                        principalTable: "Location_Records",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Speeding_Alerts_Gps_DeviceId",
                table: "Speeding_Alerts",
                column: "Gps_DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_Speeding_Alerts_Location_RecordId",
                table: "Speeding_Alerts",
                column: "Location_RecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Speeding_Alerts");
        }
    }
}
