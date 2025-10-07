using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Rentify.Server.Migrations
{
    /// <inheritdoc />
    public partial class history_Reservation_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AgencyName",
                table: "Tickets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Tickets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DelivredAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DelivredByUserId",
                table: "Reservations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InvoicedAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoicedByUserId",
                table: "Reservations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdateAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastUpdateByUserId",
                table: "Reservations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnedAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnedToUserId",
                table: "Reservations",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_DelivredByUserId",
                table: "Reservations",
                column: "DelivredByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_InvoicedByUserId",
                table: "Reservations",
                column: "InvoicedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_LastUpdateByUserId",
                table: "Reservations",
                column: "LastUpdateByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ReturnedToUserId",
                table: "Reservations",
                column: "ReturnedToUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_AspNetUsers_DelivredByUserId",
                table: "Reservations",
                column: "DelivredByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_AspNetUsers_InvoicedByUserId",
                table: "Reservations",
                column: "InvoicedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_AspNetUsers_LastUpdateByUserId",
                table: "Reservations",
                column: "LastUpdateByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_AspNetUsers_ReturnedToUserId",
                table: "Reservations",
                column: "ReturnedToUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_AspNetUsers_DelivredByUserId",
                table: "Reservations");

            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_AspNetUsers_InvoicedByUserId",
                table: "Reservations");

            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_AspNetUsers_LastUpdateByUserId",
                table: "Reservations");

            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_AspNetUsers_ReturnedToUserId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_DelivredByUserId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_InvoicedByUserId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_LastUpdateByUserId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_ReturnedToUserId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "AgencyName",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "DelivredAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "DelivredByUserId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "InvoicedAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "InvoicedByUserId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "LastUpdateAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "LastUpdateByUserId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "ReturnedAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "ReturnedToUserId",
                table: "Reservations");
        }
    }
}
