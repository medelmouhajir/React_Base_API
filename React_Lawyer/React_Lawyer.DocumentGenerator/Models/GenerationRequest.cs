using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models
{
    public class GenerationRequest
    {
        /// <summary>
        /// ID of the template to use
        /// </summary>
        [Required]
        public string TemplateId { get; set; }

        /// <summary>
        /// Client data to be used in the document
        /// </summary>
        [Required]
        public Dictionary<string, string> ClientData { get; set; }

        /// <summary>
        /// Desired output format of the document
        /// </summary>
        [Required]
        public DocumentFormat Format { get; set; } = DocumentFormat.PDF;

        /// <summary>
        /// Whether to include metadata in the document
        /// </summary>
        public bool IncludeMetadata { get; set; } = true;

        public string? DocumentTitle { get; set; }

        /// <summary>
        /// When to generate the document
        /// </summary>
        public GenerationPriority Priority { get; set; } = GenerationPriority.Normal;


        /// <summary>
        /// Additional generation options
        /// </summary>
        public GenerationOptions Options { get; set; } = new GenerationOptions();
    }


    public enum GenerationPriority
    {
        Low,
        Normal,
        High,
        Urgent
    }
}
