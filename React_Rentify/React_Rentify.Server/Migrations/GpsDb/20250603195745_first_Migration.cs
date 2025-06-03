using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Rentify.Server.Migrations.GpsDb
{
    /// <inheritdoc />
    public partial class first_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Gps_Devices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceSerialNumber = table.Column<string>(type: "text", nullable: false),
                    Model = table.Column<string>(type: "text", nullable: false),
                    InstallCarPlate = table.Column<string>(type: "text", nullable: false),
                    InstalledOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeactivatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gps_Devices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Location_Records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Gps_DeviceId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceSerialNumber = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    SpeedKmh = table.Column<double>(type: "double precision", nullable: false),
                    Heading = table.Column<double>(type: "double precision", nullable: true),
                    Altitude = table.Column<double>(type: "double precision", nullable: true),
                    IgnitionOn = table.Column<bool>(type: "boolean", nullable: true),
                    StatusFlags = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Location_Records", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Location_Records_Gps_Devices_Gps_DeviceId",
                        column: x => x.Gps_DeviceId,
                        principalTable: "Gps_Devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Location_Records_Gps_DeviceId",
                table: "Location_Records",
                column: "Gps_DeviceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Location_Records");

            migrationBuilder.DropTable(
                name: "Gps_Devices");
        }
    }
}
