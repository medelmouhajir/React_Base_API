// React_Lawyer.Server/Models/DocumentGeneration/DocumentGenerationModels.cs
using System;
using System.Text.Json.Serialization;

namespace React_Lawyer.Server.Models.DocumentGeneration
{
    /// <summary>
    /// Request to generate a document
    /// </summary>
    public class DocumentGenerationRequest
    {
        /// <summary>
        /// ID of the template to use
        /// </summary>
        public string TemplateId { get; set; }

        /// <summary>
        /// Data to populate the template
        /// </summary>
        public object? Data { get; set; }

        /// <summary>
        /// Format of the output document (PDF, DOCX, etc.)
        /// </summary>
        public string Format { get; set; } = "PDF";

        /// <summary>
        /// Title for the generated document
        /// </summary>
        public string DocumentTitle { get; set; }

        /// <summary>
        /// ID of the user generating the document
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// ID of the case this document is related to (optional)
        /// </summary>
        public int? CaseId { get; set; }

        /// <summary>
        /// ID of the client this document is related to (optional)
        /// </summary>
        public int? ClientId { get; set; }
        public int LawFirmId { get; set; }

        /// <summary>
        /// Whether to save a reference to this document in the system
        /// </summary>
        public bool SaveToCase { get; set; } = true;
    }

    /// <summary>
    /// Response from a document generation request
    /// </summary>
    public class DocumentGenerationResponse
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
        public string Format { get; set; }

        /// <summary>
        /// When the document was generated
        /// </summary>
        public DateTime GeneratedAt { get; set; }

        /// <summary>
        /// Size of the document in bytes
        /// </summary>
        public long Size { get; set; }

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

    /// <summary>
    /// Document template information
    /// </summary>
    public class DocumentTemplate
    {
        /// <summary>
        /// Unique identifier for the template
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Display name of the template
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Description of the template and its purpose
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Category of legal document (e.g., Contract, Testimony, Will)
        /// </summary>
        public string Category { get; set; }

        /// <summary>
        /// Preview or sample of the template content
        /// </summary>
        public string ContentPreview { get; set; }

        /// <summary>
        /// Default language of the template
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Jurisdiction this template is applicable for (e.g., "CA", "NY", "Federal")
        /// </summary>
        public string Jurisdiction { get; set; }

        /// <summary>
        /// List of variable fields required by this template
        /// </summary>
        public string[] RequiredFields { get; set; }
    }
}