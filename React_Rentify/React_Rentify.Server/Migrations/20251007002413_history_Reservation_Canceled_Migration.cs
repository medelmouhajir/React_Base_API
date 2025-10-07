using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Rentify.Server.Migrations
{
    /// <inheritdoc />
    public partial class history_Reservation_Canceled_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CanceledAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CanceledByUserId",
                table: "Reservations",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_CanceledByUserId",
                table: "Reservations",
                column: "CanceledByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_AspNetUsers_CanceledByUserId",
                table: "Reservations",
                column: "CanceledByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_AspNetUsers_CanceledByUserId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_CanceledByUserId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "CanceledAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "CanceledByUserId",
                table: "Reservations");
        }
    }
}
