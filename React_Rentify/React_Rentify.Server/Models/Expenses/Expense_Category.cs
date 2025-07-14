using React_Rentify.Server.Models.Agencies;

namespace React_Rentify.Server.Models.Expenses
{
    public class Expense_Category
    {
        public Guid Id { get; set; }

        public string Name { get; set; }


        public Guid AgencyId { get; set; }
        public virtual Agency? Agency { get; set; }


        public virtual ICollection<Agency_Attachment>? Agency_Attachments { get; set; }
    }
}
