namespace React_Lawyer.DocumentGenerator.Models.Included_Data
{
    public class AddressInfo
    {
        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string Country { get; set; }
        public string FormattedAddress => $"{Street}, {City}, {State} {ZipCode}, {Country}";
    }
}
