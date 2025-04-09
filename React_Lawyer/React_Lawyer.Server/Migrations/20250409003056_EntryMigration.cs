using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Lawyer.Server.Migrations
{
    /// <inheritdoc />
    public partial class EntryMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_LawFirms_LawFirmId",
                table: "TimeEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Lawyers_LawyerId",
                table: "TimeEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Users_UserId",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_UserId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "Hours",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "TimeEntries");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "TimeEntries",
                newName: "DurationMinutes");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "TimeEntries",
                newName: "ActivityDate");

            migrationBuilder.RenameIndex(
                name: "IX_TimeEntries_Date",
                table: "TimeEntries",
                newName: "IX_TimeEntries_ActivityDate");

            migrationBuilder.AlterColumn<int>(
                name: "LawyerId",
                table: "TimeEntries",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "LawFirmId",
                table: "TimeEntries",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastModified",
                table: "TimeEntries",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "HourlyRate",
                table: "TimeEntries",
                type: "numeric",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "TimeEntries",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AddColumn<bool>(
                name: "IsBilled",
                table: "TimeEntries",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_LawFirms_LawFirmId",
                table: "TimeEntries",
                column: "LawFirmId",
                principalTable: "LawFirms",
                principalColumn: "LawFirmId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Lawyers_LawyerId",
                table: "TimeEntries",
                column: "LawyerId",
                principalTable: "Lawyers",
                principalColumn: "LawyerId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_LawFirms_LawFirmId",
                table: "TimeEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Lawyers_LawyerId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "IsBilled",
                table: "TimeEntries");

            migrationBuilder.RenameColumn(
                name: "DurationMinutes",
                table: "TimeEntries",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "ActivityDate",
                table: "TimeEntries",
                newName: "Date");

            migrationBuilder.RenameIndex(
                name: "IX_TimeEntries_ActivityDate",
                table: "TimeEntries",
                newName: "IX_TimeEntries_Date");

            migrationBuilder.AlterColumn<int>(
                name: "LawyerId",
                table: "TimeEntries",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "LawFirmId",
                table: "TimeEntries",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastModified",
                table: "TimeEntries",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<decimal>(
                name: "HourlyRate",
                table: "TimeEntries",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "TimeEntries",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<decimal>(
                name: "Hours",
                table: "TimeEntries",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "TimeEntries",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_UserId",
                table: "TimeEntries",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_LawFirms_LawFirmId",
                table: "TimeEntries",
                column: "LawFirmId",
                principalTable: "LawFirms",
                principalColumn: "LawFirmId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Lawyers_LawyerId",
                table: "TimeEntries",
                column: "LawyerId",
                principalTable: "Lawyers",
                principalColumn: "LawyerId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Users_UserId",
                table: "TimeEntries",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
