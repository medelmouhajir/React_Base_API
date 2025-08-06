using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Entities
{
    public abstract class CommentEntity<TEntity> : BaseEntity where TEntity : BaseEntity
    {
        [Range(1, 5, ErrorMessage = "Score must be between 1 and 5")]
        public int Score { get; set; }

        [Required, MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;
        public virtual User User { get; set; } = null!;

        [Required]
        public Guid EntityId { get; set; }
        public virtual TEntity Entity { get; set; } = null!;

        // Computed properties
        public bool IsRecent => CreatedAt > DateTime.UtcNow.AddDays(-7);
    }
}
