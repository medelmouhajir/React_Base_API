namespace React_Lawyer.DocumentGenerator.Models.Included_Data
{
    public class UserInfo
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; }
        public string Role { get; set; }
        public string Title { get; set; }
        public string BarNumber { get; set; }
        public string Signature { get; set; }
    }
}
