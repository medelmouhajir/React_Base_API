using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Rentify.Server.Migrations
{
    /// <inheritdoc />
    public partial class Accidents_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Blacklist");

            migrationBuilder.AddColumn<DateTime>(
                name: "AssuranceEndDate",
                table: "Cars",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssuranceName",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AssuranceStartDate",
                table: "Cars",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TechnicalVisitEndDate",
                table: "Cars",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TechnicalVisitStartDate",
                table: "Cars",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Accidents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgencyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CarId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uuid", nullable: true),
                    AccidentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ExpertFullname = table.Column<string>(type: "text", nullable: true),
                    ExpertPhone = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accidents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accidents_Agencies_AgencyId",
                        column: x => x.AgencyId,
                        principalTable: "Agencies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Accidents_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Accidents_Cars_CarId",
                        column: x => x.CarId,
                        principalTable: "Cars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Accidents_Reservations_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Accident_Expenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<double>(type: "double precision", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AccidentId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accident_Expenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accident_Expenses_Accidents_AccidentId",
                        column: x => x.AccidentId,
                        principalTable: "Accidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Accident_Refunds",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<double>(type: "double precision", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AccidentId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accident_Refunds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accident_Refunds_Accidents_AccidentId",
                        column: x => x.AccidentId,
                        principalTable: "Accidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accident_Expenses_AccidentId",
                table: "Accident_Expenses",
                column: "AccidentId");

            migrationBuilder.CreateIndex(
                name: "IX_Accident_Refunds_AccidentId",
                table: "Accident_Refunds",
                column: "AccidentId");

            migrationBuilder.CreateIndex(
                name: "IX_Accidents_AgencyId",
                table: "Accidents",
                column: "AgencyId");

            migrationBuilder.CreateIndex(
                name: "IX_Accidents_CarId",
                table: "Accidents",
                column: "CarId");

            migrationBuilder.CreateIndex(
                name: "IX_Accidents_CreatedByUserId",
                table: "Accidents",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Accidents_ReservationId",
                table: "Accidents",
                column: "ReservationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Accident_Expenses");

            migrationBuilder.DropTable(
                name: "Accident_Refunds");

            migrationBuilder.DropTable(
                name: "Accidents");

            migrationBuilder.DropColumn(
                name: "AssuranceEndDate",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "AssuranceName",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "AssuranceStartDate",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "TechnicalVisitEndDate",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "TechnicalVisitStartDate",
                table: "Cars");

            migrationBuilder.CreateTable(
                name: "Blacklist",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReportedByAgencyId = table.Column<Guid>(type: "uuid", nullable: false),
                    DateAdded = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    LicenseNumber = table.Column<string>(type: "text", nullable: true),
                    NationalId = table.Column<string>(type: "text", nullable: true),
                    PassportId = table.Column<string>(type: "text", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Blacklist", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Blacklist_Agencies_ReportedByAgencyId",
                        column: x => x.ReportedByAgencyId,
                        principalTable: "Agencies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Blacklist_ReportedByAgencyId",
                table: "Blacklist",
                column: "ReportedByAgencyId");
        }
    }
}
