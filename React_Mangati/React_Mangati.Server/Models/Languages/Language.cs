using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Languages
{
    public class Language
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; }

        public virtual ICollection<Serie_Language>? MangaLanguages { get; set; }
    }
}
