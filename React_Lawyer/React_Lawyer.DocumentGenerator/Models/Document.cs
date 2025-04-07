using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DocumentGeneratorAPI.Models
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
        /// Generated content of the document
        /// </summary>
        [Required]
        public string Content { get; set; }

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
        /// Storage path or identifier for the document file
        /// </summary>
        public string StoragePath { get; set; }

        /// <summary>
        /// Public URL to access the document
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Additional metadata as key-value pairs
        /// </summary>
        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
    }

    /// <summary>
    /// Document format types
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum DocumentFormat
    {
        PDF,
        DOCX,
        HTML,
        Markdown,
        TXT
    }
}