using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models
{
    public class Template
    {
        /// <summary>
        /// Unique identifier for the template
        /// </summary>
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Display name of the template
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// Description of the template and its purpose
        /// </summary>
        [StringLength(500)]
        public string Description { get; set; }

        /// <summary>
        /// Category of legal document (e.g., Contract, Testimony, Will)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Category { get; set; }

        /// <summary>
        /// Content of the template with variable placeholders
        /// </summary>
        [Required]
        public string Content { get; set; }

        /// <summary>
        /// Metadata about the required variables/fields for this template
        /// </summary>
        public List<TemplateVariable> Variables { get; set; } = new List<TemplateVariable>();

        /// <summary>
        /// Version of the template
        /// </summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Whether this template is active and can be used
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// When the template was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the template was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User ID who created this template
        /// </summary>
        public string CreatedBy { get; set; }

        /// <summary>
        /// Whether this template has been fine-tuned with Gemini
        /// </summary>
        public bool IsFineTuned { get; set; } = false;

        /// <summary>
        /// Instructions specific to this template for Gemini
        /// </summary>
        public string GenerationInstructions { get; set; }

        /// <summary>
        /// Default language of the template
        /// </summary>
        [StringLength(10)]
        public string Language { get; set; } = "en";

        /// <summary>
        /// Jurisdiction this template is applicable for (e.g., "CA", "NY", "Federal")
        /// </summary>
        [StringLength(50)]
        public string Jurisdiction { get; set; }
    }
}
