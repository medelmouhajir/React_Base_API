using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Customers;
using React_Rentify.Server.Models.Expenses;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Models.Agencies
{
    public class Agency
    {
        public Guid Id { get; set; }


        public string Name { get; set; }
        public string Address { get; set; }
        public string PhoneOne { get; set; }
        public string? PhoneTwo { get; set; }
        public string? Email { get; set; }
        public string? Conditions { get; set; }
        public string LogoUrl { get; set; }
        public string? LogoUrlAssociation { get; set; }

        // Navigation:
        public virtual ICollection<User>? Users { get; set; }
        public virtual ICollection<Car>? Cars { get; set; }
        public virtual ICollection<Customer>? Customers { get; set; }
        public virtual ICollection<Reservation>? Reservations { get; set; }

        /// <summary>
        /// File attachments (e.g., registration documents, logos, certificates).
        /// </summary>
        public virtual ICollection<Agency_Attachment>? Agency_Attachments { get; set; }
        public virtual ICollection<Expense_Category>? Expense_Categories { get; set; }
    }
}
