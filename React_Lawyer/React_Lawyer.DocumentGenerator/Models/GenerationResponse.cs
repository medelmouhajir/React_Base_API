namespace React_Lawyer.DocumentGenerator.Models
{
    public class GenerationResponse
    {
        /// <summary>
        /// ID of the generated document
        /// </summary>
        public string DocumentId { get; set; }

        /// <summary>
        /// URL to download or access the document
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Format of the generated document
        /// </summary>
        public DocumentFormat Format { get; set; }

        /// <summary>
        /// Status of the generation process
        /// </summary>
        public GenerationStatus Status { get; set; } = GenerationStatus.Completed;

        /// <summary>
        /// When the document was generated
        /// </summary>
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Size of the document in bytes
        /// </summary>
        public long Size { get; set; }

        /// <summary>
        /// Display name/title of the document
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
        /// Any errors that occurred during generation
        /// </summary>
        public string Error { get; set; }

        /// <summary>
        /// Content hash for versioning and integrity
        /// </summary>
        public string ContentHash { get; set; }

        /// <summary>
        /// Job ID for async generations
        /// </summary>
        public string JobId { get; set; }

        /// <summary>
        /// Statistics about the generation process
        /// </summary>
        public GenerationStats Stats { get; set; }
    }

    /// <summary>
    /// Status of document generation
    /// </summary>
    public enum GenerationStatus
    {
        Queued,
        Processing,
        Completed,
        Failed,
        Cancelled
    }
}
