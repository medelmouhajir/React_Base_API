namespace React_Lawyer.DocumentGenerator.Models.Included_Data
{
    public class ClientInfo
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; }
        public string Phone { get; set; }
        public AddressInfo Address { get; set; }
        public string CompanyName { get; set; }
        public string TaxId { get; set; }
        public bool IsCompany { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Nationality { get; set; }
        public string IdNumber { get; set; }
        public Dictionary<string, object> AdditionalDetails { get; set; } = new Dictionary<string, object>();
    }
}
