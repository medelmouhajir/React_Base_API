namespace React_Lawyer.DocumentGenerator.Models.Included_Data
{
    public class FirmInfo
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string TaxId { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string Website { get; set; }
        public AddressInfo Address { get; set; }
        public string LogoUrl { get; set; }
    }
}
