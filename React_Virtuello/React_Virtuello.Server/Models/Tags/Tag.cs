namespace React_Virtuello.Server.Models.Tags
{
    public class Tag
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public string? Icon_Path { get; set; }

        public List<Business_Tag>? Businesses { get; set; }
    }
}
