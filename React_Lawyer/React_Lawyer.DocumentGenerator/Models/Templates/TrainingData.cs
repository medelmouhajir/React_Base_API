using React_Lawyer.DocumentGenerator.Models.Templates.Training;
using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models.Templates
{
    public class TrainingData
    {
        /// <summary>
        /// Unique identifier
        /// </summary>
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Name of this training set
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// Description of the training data
        /// </summary>
        [StringLength(500)]
        public string Description { get; set; }

        /// <summary>
        /// Category or type of document this training is for
        /// </summary>
        [StringLength(50)]
        public string Category { get; set; }

        /// <summary>
        /// Template ID this training data is associated with
        /// </summary>
        public string TemplateId { get; set; }

        /// <summary>
        /// Creation date
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last modified date
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Document examples for training
        /// </summary>
        public List<DocumentExample> Examples { get; set; } = new List<DocumentExample>();

        /// <summary>
        /// Whether this training data is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Used to keep track of last training/fine-tuning
        /// </summary>
        public DateTime? LastTrainedAt { get; set; }

        /// <summary>
        /// Status of the training
        /// </summary>
        public TrainingStatus Status { get; set; } = TrainingStatus.Draft;

        /// <summary>
        /// Training quality metrics
        /// </summary>
        public TrainingMetrics Metrics { get; set; }

        /// <summary>
        /// Model ID that was created from this training
        /// </summary>
        public string ModelId { get; set; }
    }
}
