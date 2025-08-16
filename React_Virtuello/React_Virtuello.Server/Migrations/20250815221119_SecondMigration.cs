using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Virtuello.Server.Migrations
{
    /// <inheritdoc />
    public partial class SecondMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Event_Categories",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Event_Categories",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Event_Categories",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Event_Categories",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Event_Categories",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Event_Categories");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Event_Categories");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Event_Categories");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Event_Categories");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Event_Categories");
        }
    }
}
