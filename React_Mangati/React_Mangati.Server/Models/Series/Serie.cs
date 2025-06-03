using React_Mangati.Server.Models.Languages;
using React_Mangati.Server.Models.Series.Chapters;
using React_Mangati.Server.Models.Tags;
using React_Mangati.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Series
{
    public class Serie
    {
        [Key]
        public int Id { get; set; }


        [Required, MaxLength(200)]
        public string Title { get; set; }

        [MaxLength(2000)]
        public string Synopsis { get; set; }

        [Url]
        public string? CoverImageUrl { get; set; }

        [Required]
        public Serie_Status Status { get; set; }

        //[defv(false)]
        //public bool Is_For_Studio { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Foreign key to owner (writer)
        public string AuthorId { get; set; }
        public virtual User? Author { get; set; }

        // Relations
        public virtual ICollection<Chapter>? Chapters { get; set; }
        public virtual ICollection<Serie_Tag>? Serie_Tags { get; set; }
        public virtual ICollection<Serie_Language>? Serie_Languages { get; set; }
    }

    public enum Serie_Status
    {
        Ongoing = 0,
        Completed = 1,
        Canceled = 2,
    }
}
