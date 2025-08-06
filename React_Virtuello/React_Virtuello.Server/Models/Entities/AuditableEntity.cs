using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Entities
{
    public abstract class AuditableEntity : BaseEntity
    {
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }


        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        [MaxLength(450)]
        public string? DeletedBy { get; set; }
    }
}
