using React_Mangati.Server.Models.Languages;
using React_Mangati.Server.Models.Series.Chapters;
using React_Mangati.Server.Models.Studio.Characters;
using React_Mangati.Server.Models.Studio.Characters.Groups;
using React_Mangati.Server.Models.Studio.Places;
using React_Mangati.Server.Models.Studio.Places.Goups;
using React_Mangati.Server.Models.Tags;
using React_Mangati.Server.Models.Users;
using System.ComponentModel;
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

        [DefaultValue(false)]
        public bool Is_For_Studio { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Foreign key to owner (writer)
        public string AuthorId { get; set; }
        public virtual User? Author { get; set; }

        // Relations
        public virtual ICollection<Chapter>? Chapters { get; set; }
        public virtual ICollection<Serie_Tag>? Serie_Tags { get; set; }
        public virtual ICollection<Serie_Language>? Serie_Languages { get; set; }
        public virtual ICollection<Character>? Characters { get; set; }
        public virtual ICollection<Characters_Group>? Characters_Groups { get; set; }
        public virtual ICollection<Place_Scene>? Place_Scenes { get; set; }
        public virtual ICollection<Places_Group>? Places_Groups { get; set; }
    }

    public enum Serie_Status
    {
        Ongoing = 0,
        Completed = 1,
        Canceled = 2,
    }
}
