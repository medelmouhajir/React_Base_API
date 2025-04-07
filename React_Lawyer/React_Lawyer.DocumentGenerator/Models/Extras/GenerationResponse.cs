using DocumentGeneratorAPI.Models;

namespace React_Lawyer.DocumentGenerator.Models.Extras
{
    public class GenerationResponse
    {
        /// <summary>
        /// ID of the generated document
        /// </summary>
        public string DocumentId { get; set; }

        /// <summary>
        /// Title of the document
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// URL to download or access the document
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Format of the generated document
        /// </summary>
        public DocumentFormat Format { get; set; }

        /// <summary>
        /// When the document was generated
        /// </summary>
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Size of the document in bytes
        /// </summary>
        public long Size { get; set; }

        /// <summary>
        /// Content of the document
        /// </summary>
        public string Content { get; set; }

        /// <summary>
        /// ID of the template used
        /// </summary>
        public string TemplateId { get; set; }

        /// <summary>
        /// Template name used
        /// </summary>
        public string TemplateName { get; set; }

        /// <summary>
        /// Error message if generation failed
        /// </summary>
        public string Error { get; set; }
    }
}
