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
        /// Template name
        /// </summary>
        [StringLength(100)]
        public string TemplateName { get; set; }

        /// <summary>
        /// ID of the client this document is for
        /// </summary>
        public int ClientId { get; set; }

        /// <summary>
        /// ID of the case this document is associated with (if any)
        /// </summary>
        public int? CaseId { get; set; }

        /// <summary>
        /// ID of the law firm
        /// </summary>
        public int? LawFirmId { get; set; }

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
        /// Template version used
        /// </summary>
        public int TemplateVersion { get; set; }

        /// <summary>
        /// Hash of the document content for versioning
        /// </summary>
        public string ContentHash { get; set; }

        /// <summary>
        /// Client data used to generate the document (serialized)
        /// </summary>
        public string ClientDataSnapshot { get; set; }

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

        /// <summary>
        /// Whether the document has been shared with the client
        /// </summary>
        public bool IsSharedWithClient { get; set; } = false;

        /// <summary>
        /// When the document was shared with the client
        /// </summary>
        public DateTime? SharedAt { get; set; }

        /// <summary>
        /// Expiration date for document access
        /// </summary>
        public DateTime? ExpiresAt { get; set; }

        /// <summary>
        /// Tags for categorization
        /// </summary>
        public List<string> Tags { get; set; } = new List<string>();
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
