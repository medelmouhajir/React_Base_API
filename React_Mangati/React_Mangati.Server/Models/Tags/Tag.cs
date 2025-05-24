using System.ComponentModel.DataAnnotations;

namespace React_Mangati.Server.Models.Tags
{
    public class Tag
    {
        public int TagId { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; }

        public virtual ICollection<Serie_Tag>? MangaTags { get; set; }
    }
}
