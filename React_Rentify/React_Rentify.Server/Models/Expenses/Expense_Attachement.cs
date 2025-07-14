using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Models.Expenses
{
    public class Expense_Attachement
    {
        public Guid Id { get; set; }

        public string Title { get; set; }

        public string Url_Path { get; set; }

        public DateTime Created_At { get; set; }

        public Guid ExpenseId { get; set; }
        public virtual Expense? Expense { get; set; }

    }
}
