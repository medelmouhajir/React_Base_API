using DocumentGeneratorAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models.Extras
{
    public class GenerationRequest
    {
        /// <summary>
        /// ID of the template to use
        /// </summary>
        [Required]
        public string TemplateId { get; set; }

        /// <summary>
        /// Variable data to be filled in the template
        /// </summary>
        [Required]
        public Dictionary<string, string> Variables { get; set; }

        /// <summary>
        /// Desired output format of the document
        /// </summary>
        [Required]
        public DocumentFormat Format { get; set; } = DocumentFormat.PDF;

        /// <summary>
        /// Document title
        /// </summary>
        [Required]
        public string DocumentTitle { get; set; }

        /// <summary>
        /// ID of the user generating the document
        /// </summary>
        public string UserId { get; set; }
    }
}
