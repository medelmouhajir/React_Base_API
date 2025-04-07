using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models
{
    public class Document
    {
        /// <summary>
        /// Unique identifier for the document
        /// </summary>
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Title of the document
        /// </summary>
        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        /// <summary>
        /// ID of the template used to generate this document
        /// </summary>
        [Required]
        public string TemplateId { get; set; }


        /// <summary>
        /// When the document was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// ID of the user who generated this document
        /// </summary>
        public string CreatedBy { get; set; }

        /// <summary>
        /// Format of the document
        /// </summary>
        [Required]
        public DocumentFormat Format { get; set; }

        /// <summary>
        /// Size of the document in bytes
        /// </summary>
        public long Size { get; set; }

        /// <summary>
        /// Storage path or identifier for the document content
        /// </summary>
        [Required]
        public string StoragePath { get; set; }

        /// <summary>
        /// Public URL to access the document
        /// </summary>
        public string Url { get; set; }



        /// <summary>
        /// Hash of the document content for versioning
        /// </summary>
        public string ContentHash { get; set; }

        /// <summary>
        /// Document metadata
        /// </summary>
        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Whether this document has been finalized/locked
        /// </summary>
        public bool IsFinalized { get; set; } = false;

        /// <summary>
        /// Document status
        /// </summary>
        public DocumentStatus Status { get; set; } = DocumentStatus.Draft;

    }

    /// <summary>
    /// Document status
    /// </summary>
    public enum DocumentStatus
    {
        Draft,
        Final,
        Signed,
        Archived,
        Deleted
    }
    public enum DocumentFormat
    {
        PDF,
        DOCX,
        HTML,
        Markdown,
        RTF,
        TXT
    }
}
