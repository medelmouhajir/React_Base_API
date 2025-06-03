using React_Rentify.Server.Models.Agencies;

namespace React_Rentify.Server.Models.Blacklists
{
    public class Blacklist_Entry
    {
        public Guid Id { get; set; }


        /// <summary>
        /// The national or license ID identifying the person.
        /// </summary>
        public string? NationalId { get; set; }
        public string? PassportId { get; set; }
        public string? LicenseNumber { get; set; }

        public string FullName { get; set; }

        /// <summary>
        /// Explanation of why they’re blacklisted (e.g. “Non-payment”, “Vehicle damage”).
        /// </summary>
        public string Reason { get; set; }

        public DateTime DateAdded { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Which agency reported this person.
        /// </summary>
        public Guid ReportedByAgencyId { get; set; }
        public Agency? ReportedByAgency { get; set; }
    }
}
