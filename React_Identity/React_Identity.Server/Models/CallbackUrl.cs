using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace React_Identity.Server.Models
{
    public class CallbackUrl
    {
        [Key]
        public int CallbackUrlId { get; set; }

        [Required, Url]
        public string Url { get; set; } = string.Empty;

        [Required]
        public Guid AccountId { get; set; }

        [ForeignKey(nameof(AccountId))]
        public Account Account { get; set; } = null!;

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
