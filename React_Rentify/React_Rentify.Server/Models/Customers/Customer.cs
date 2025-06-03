using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Reservations;

namespace React_Rentify.Server.Models.Customers
{
    public class Customer
    {
        public Guid Id { get; set; }


        /// <summary>
        /// The agency that created this customer profile.
        /// </summary>
        public Guid AgencyId { get; set; }
        public Agency? Agency { get; set; }

        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }

        /// <summary>
        /// National ID or driving license number (used to check blacklist).
        /// </summary>
        public string? NationalId { get; set; }
        public string? PassportId { get; set; }

        /// <summary>
        /// Driver's license number (if different from NationalId).
        /// </summary>
        public string LicenseNumber { get; set; }

        public DateTime DateOfBirth { get; set; }

        public string Address { get; set; }

        /// <summary>
        /// If true, this customer is blacklisted by this agency.
        /// (Separate from the global BlacklistEntry table.)
        /// </summary>
        public bool IsBlacklisted { get; set; }

        // Navigation:
        public virtual ICollection<Reservation>? Reservations { get; set; }

        /// <summary>
        /// File attachments (e.g., scanned ID, proof of address, signed contract).
        /// </summary>
        public ICollection<Customer_Attachment>? Customer_Attachments { get; set; }
    }
}
