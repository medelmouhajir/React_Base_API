using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Series.Chapters
{
    public class Chapter
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Title { get; set; }

        [Required]
        public int Number { get; set; }


        public Chapter_Status Status { get; set; } = Chapter_Status.Pending;

        [Required]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // FK to series
        public int SerieId { get; set; }
        public virtual Serie? Serie { get; set; }

        public virtual ICollection<Page>? Pages { get; set; }
    }

    public enum Chapter_Status
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2,
        Published = 3
    }
}
