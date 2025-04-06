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
        /// Client ID for whom the document is being generated
        /// </summary>
        public int ClientId { get; set; }

        /// <summary>
        /// Case ID associated with this document (if applicable)
        /// </summary>
        public int? CaseId { get; set; }

        /// <summary>
        /// Client data to be used in the document
        /// </summary>
        [Required]
        public Dictionary<string, object> ClientData { get; set; }

        /// <summary>
        /// Desired output format of the document
        /// </summary>
        [Required]
        public DocumentFormat Format { get; set; } = DocumentFormat.PDF;

        /// <summary>
        /// Whether to include metadata in the document
        /// </summary>
        public bool IncludeMetadata { get; set; } = true;

        /// <summary>
        /// Optional ID of the user generating the document
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// Optional title for the generated document
        /// </summary>
        public string DocumentTitle { get; set; }

        /// <summary>
        /// When to generate the document
        /// </summary>
        public GenerationPriority Priority { get; set; } = GenerationPriority.Normal;

        /// <summary>
        /// Optional ID of a law firm
        /// </summary>
        public int? LawFirmId { get; set; }

        /// <summary>
        /// Callback URL for async generation notification
        /// </summary>
        public string CallbackUrl { get; set; }

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
