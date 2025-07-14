using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Models.Expenses
{
    public class Expense
    {
        public Guid Id { get; set; }

        public string Title { get; set; }

        public string? Description { get; set; }
        public decimal Amount { get; set; }

        public DateTime Created_At { get; set; }


        public Guid AgencyId { get; set; }
        public virtual Agency? Agency { get; set; }


        public string Created_ById { get; set; }
        public virtual User? Created_By { get; set; }

        public Guid Expense_CategoryId { get; set; }
        public virtual Expense_Category? Expense_Category { get; set; }


        public virtual ICollection<Expense_Attachement>? Expense_Attachements { get; set; }
    }
}
