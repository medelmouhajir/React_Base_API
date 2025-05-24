using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Series.Chapters
{
    public class Page
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ImageUrl { get; set; }

        public long FileSizeBytes { get; set; }

        public int Order { get; set; }

        // FK to chapter
        public int ChapterId { get; set; }
        public virtual Chapter? Chapter { get; set; }
    }
}
