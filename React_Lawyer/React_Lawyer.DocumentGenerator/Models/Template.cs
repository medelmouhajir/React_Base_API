﻿using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.DocumentGenerator.Models
{
    public class Template
    {
        /// <summary>
        /// Unique identifier for the template
        /// </summary>
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Display name of the template
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        /// <summary>
        /// Description of the template and its purpose
        /// </summary>
        [StringLength(500)]
        public string Description { get; set; }

        /// <summary>
        /// Category of legal document (e.g., Contract, Testimony, Will)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Category { get; set; }

        /// <summary>
        /// Content of the template with variable placeholders
        /// </summary>
        [Required]
        public string Content { get; set; }


        public bool IsActive { get; set; } = true;

        /// <summary>
        /// When the template was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;



        /// <summary>
        /// Whether this template has been fine-tuned with Gemini
        /// </summary>
        public bool IsFineTuned { get; set; } = false;

        /// <summary>
        /// Instructions specific to this template for Gemini
        /// </summary>
        public string GenerationInstructions { get; set; }

        /// <summary>
        /// Default language of the template
        /// </summary>
        [StringLength(10)]
        public string Language { get; set; } = "en";

        /// <summary>
        /// Jurisdiction this template is applicable for (e.g., "CA", "NY", "Federal")
        /// </summary>
        [StringLength(50)]
        public string Jurisdiction { get; set; }
    }
}
