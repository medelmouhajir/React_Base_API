namespace React_Virtuello.Server.DTOs.Tags
{
    public class TagDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? IconPath { get; set; }
    }
}