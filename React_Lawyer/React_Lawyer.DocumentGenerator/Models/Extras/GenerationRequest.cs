using DocumentGeneratorAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models.Extras
{
    public class GenerationRequest
    {
        [Required]
        public string TemplateId { get; set; }

        // Change from Dictionary<string, string> to object to accept any JSON structure
        [Required]
        public object Data { get; set; }

        [Required]
        public DocumentGeneratorAPI.Models.DocumentFormat Format { get; set; } = DocumentGeneratorAPI.Models.DocumentFormat.PDF;

        [Required]
        public string DocumentTitle { get; set; }

        public string UserId { get; set; }
    }
}
