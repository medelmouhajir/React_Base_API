using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models.Templates
{
    public class DocumentExample
    {
        /// <summary>
        /// ID of this example
        /// </summary>
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Original document text (without variables filled in)
        /// </summary>
        [Required]
        public string OriginalText { get; set; }

        /// <summary>
        /// Final document text (with variables filled in correctly)
        /// </summary>
        [Required]
        public string FinalText { get; set; }

        /// <summary>
        /// Variables that were used in this example
        /// </summary>
        public Dictionary<string, object> Variables { get; set; } = new Dictionary<string, object>();

        /// <summary>
        /// Quality rating for this example
        /// </summary>
        public int Quality { get; set; } = 5;

        /// <summary>
        /// Whether this example is verified for accuracy
        /// </summary>
        public bool IsVerified { get; set; } = false;

        /// <summary>
        /// Source of this example
        /// </summary>
        [StringLength(100)]
        public string Source { get; set; }

        /// <summary>
        /// When this example was added
        /// </summary>
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Status of training data
    /// </summary>
}
