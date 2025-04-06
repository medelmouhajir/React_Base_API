using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models.Templates
{
    /// <summary>
    /// Represents a collection of related templates
    /// </summary>
    public class TemplateCollection
    {
        /// <summary>
        /// Unique identifier for the collection
        /// </summary>
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Name of the collection
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// Description of the collection
        /// </summary>
        [StringLength(500)]
        public string Description { get; set; }

        /// <summary>
        /// Legal area or category for the collection
        /// </summary>
        [StringLength(50)]
        public string Category { get; set; }

        /// <summary>
        /// Templates included in this collection
        /// </summary>
        public List<string> TemplateIds { get; set; } = new List<string>();

        /// <summary>
        /// Whether the collection is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Creation date
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update date
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Creator of the collection
        /// </summary>
        public string CreatedBy { get; set; }

        /// <summary>
        /// Tags for categorization
        /// </summary>
        public List<string> Tags { get; set; } = new List<string>();

        /// <summary>
        /// Firm ID that owns this collection (null for system collections)
        /// </summary>
        public int? FirmId { get; set; }
    }
}
