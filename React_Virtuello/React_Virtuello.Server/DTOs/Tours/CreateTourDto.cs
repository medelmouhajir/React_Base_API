namespace React_Virtuello.Server.DTOs.Tours
{
    public class CreateTourDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImagePath { get; set; }
        public string? OwnerId { get; set; }
    }
}