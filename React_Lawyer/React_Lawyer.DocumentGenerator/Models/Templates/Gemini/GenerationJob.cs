using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models.Templates.Gemini
{
    public class GenerationJob
    {
        /// <summary>
        /// Unique identifier for the job
        /// </summary>
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Generation request that created this job
        /// </summary>
        public GenerationRequest Request { get; set; }

        /// <summary>
        /// Current status of the job
        /// </summary>
        public GenerationStatus Status { get; set; } = GenerationStatus.Queued;

        /// <summary>
        /// When the job was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the job was started
        /// </summary>
        public DateTime? StartedAt { get; set; }

        /// <summary>
        /// When the job was completed
        /// </summary>
        public DateTime? CompletedAt { get; set; }

        /// <summary>
        /// Number of retry attempts
        /// </summary>
        public int RetryCount { get; set; } = 0;

        /// <summary>
        /// Maximum number of retry attempts
        /// </summary>
        public int MaxRetries { get; set; } = 3;

        /// <summary>
        /// Job priority
        /// </summary>
        public GenerationPriority Priority { get; set; }

        /// <summary>
        /// URL to notify when job completes
        /// </summary>
        public string CallbackUrl { get; set; }

        /// <summary>
        /// Error message if the job failed
        /// </summary>
        public string Error { get; set; }

        /// <summary>
        /// Document ID of the generated document
        /// </summary>
        public string DocumentId { get; set; }

        /// <summary>
        /// Progress percentage (0-100)
        /// </summary>
        public int Progress { get; set; } = 0;

        /// <summary>
        /// Logs from the generation process
        /// </summary>
        public List<string> Logs { get; set; } = new List<string>();

        /// <summary>
        /// Job metadata
        /// </summary>
        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
    }
}
