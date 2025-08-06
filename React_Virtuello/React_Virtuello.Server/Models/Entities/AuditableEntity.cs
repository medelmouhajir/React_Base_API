namespace React_Virtuello.Server.Models.Entities
{
    public abstract class AuditableEntity : BaseEntity
    {
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
