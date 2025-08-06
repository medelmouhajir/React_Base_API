using React_Virtuello.Server.Models.Entities;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Attachments
{
    public abstract class Attachment : BaseEntity
    {
        [Required, MaxLength(255)]
        public string Name { get; set; }

        [Required]
        public string Path { get; set; }

        [MaxLength(100)]
        public string? ContentType { get; set; }

        public long FileSize { get; set; }
    }
}
