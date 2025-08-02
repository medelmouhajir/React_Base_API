namespace React_Virtuello.Server.Models.Tags
{
    public class Tag
    {
        public string Id { get; set; }
        public string Name { get; set; }

        public string? Icon { get; set; }

        public List<Business_Tag>? Businesses { get; set; }
    }
}
