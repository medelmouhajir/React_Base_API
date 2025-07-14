using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace React_Rentify.Server.Migrations
{
    /// <inheritdoc />
    public partial class expenses_Migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "Expense_CategoryId",
                table: "Agency_Attachments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Conditions",
                table: "Agencies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrlAssociation",
                table: "Agencies",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Expense_Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    AgencyId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expense_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Expense_Categories_Agencies_AgencyId",
                        column: x => x.AgencyId,
                        principalTable: "Agencies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Created_At = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AgencyId = table.Column<Guid>(type: "uuid", nullable: false),
                    Created_ById = table.Column<string>(type: "text", nullable: false),
                    Expense_CategoryId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Expenses_Agencies_AgencyId",
                        column: x => x.AgencyId,
                        principalTable: "Agencies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Expenses_AspNetUsers_Created_ById",
                        column: x => x.Created_ById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Expenses_Expense_Categories_Expense_CategoryId",
                        column: x => x.Expense_CategoryId,
                        principalTable: "Expense_Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Expense_Attachements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Url_Path = table.Column<string>(type: "text", nullable: false),
                    Created_At = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpenseId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expense_Attachements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Expense_Attachements_Expenses_ExpenseId",
                        column: x => x.ExpenseId,
                        principalTable: "Expenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Agency_Attachments_Expense_CategoryId",
                table: "Agency_Attachments",
                column: "Expense_CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Expense_Attachements_ExpenseId",
                table: "Expense_Attachements",
                column: "ExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_Expense_Categories_AgencyId",
                table: "Expense_Categories",
                column: "AgencyId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_AgencyId",
                table: "Expenses",
                column: "AgencyId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_Created_ById",
                table: "Expenses",
                column: "Created_ById");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_Expense_CategoryId",
                table: "Expenses",
                column: "Expense_CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Agency_Attachments_Expense_Categories_Expense_CategoryId",
                table: "Agency_Attachments",
                column: "Expense_CategoryId",
                principalTable: "Expense_Categories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agency_Attachments_Expense_Categories_Expense_CategoryId",
                table: "Agency_Attachments");

            migrationBuilder.DropTable(
                name: "Expense_Attachements");

            migrationBuilder.DropTable(
                name: "Expenses");

            migrationBuilder.DropTable(
                name: "Expense_Categories");

            migrationBuilder.DropIndex(
                name: "IX_Agency_Attachments_Expense_CategoryId",
                table: "Agency_Attachments");

            migrationBuilder.DropColumn(
                name: "Expense_CategoryId",
                table: "Agency_Attachments");

            migrationBuilder.DropColumn(
                name: "Conditions",
                table: "Agencies");

            migrationBuilder.DropColumn(
                name: "LogoUrlAssociation",
                table: "Agencies");
        }
    }
}
