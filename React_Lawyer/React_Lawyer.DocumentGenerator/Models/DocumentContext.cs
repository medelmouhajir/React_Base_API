using React_Lawyer.DocumentGenerator.Models.Included_Data;
using System.ComponentModel.DataAnnotations;
using System.Dynamic;
using System.IO;

namespace React_Lawyer.DocumentGenerator.Models
{
    public class DocumentContext
    {
        /// <summary>
        /// Template being used
        /// </summary>
        [Required]
        public Template Template { get; set; }

        /// <summary>
        /// Client information
        /// </summary>
        [Required]
        public ClientInfo Client { get; set; }

        /// <summary>
        /// Case information (if applicable)
        /// </summary>
        public CaseInfo Case { get; set; }

        /// <summary>
        /// Law firm information
        /// </summary>
        public FirmInfo Firm { get; set; }

        /// <summary>
        /// User who initiated the generation
        /// </summary>
        public UserInfo User { get; set; }

        /// <summary>
        /// Additional variables provided for the document
        /// </summary>
        public Dictionary<string, object> Variables { get; set; } = new Dictionary<string, object>();

        /// <summary>
        /// Current date/time for document dating
        /// </summary>
        public DateTime GenerationDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Format of the document being generated
        /// </summary>
        public DocumentFormat Format { get; set; }

        /// <summary>
        /// Output language
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Jurisdiction for the document
        /// </summary>
        public string Jurisdiction { get; set; }
    }
}
