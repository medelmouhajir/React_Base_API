namespace React_Virtuello.Server.Models.Businesses
{
    public class Business_Attachement
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Name { get; set; }
        public string Path { get; set; }

        public DateTime CreatedAt { get; set; }

        public Guid? BusinessId { get; set; }
        public virtual Business? Business { get; set; }
    }
}
