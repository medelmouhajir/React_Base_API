namespace React_Lawyer.DocumentGenerator.Models
{
    public class GenerationOptions
    {
        /// <summary>
        /// Temperature setting for AI generation (higher = more creative)
        /// </summary>
        public float Temperature { get; set; } = 0.2f;

        /// <summary>
        /// Whether to store generation history
        /// </summary>
        public bool StoreHistory { get; set; } = true;

        /// <summary>
        /// Whether to validate client data against template variables
        /// </summary>
        public bool ValidateData { get; set; } = true;

        /// <summary>
        /// Whether to add generation metadata footer
        /// </summary>
        public bool AddFooter { get; set; } = true;

        /// <summary>
        /// Whether to apply firm branding
        /// </summary>
        public bool ApplyBranding { get; set; } = true;

        /// <summary>
        /// Language to generate in
        /// </summary>
        public string Language { get; set; } = "en";

        /// <summary>
        /// Specific jurisdiction to target (overrides template default)
        /// </summary>
        public string Jurisdiction { get; set; }

        /// <summary>
        /// Document-specific settings for each format
        /// </summary>
        public Dictionary<string, object> FormatSettings { get; set; } = new Dictionary<string, object>();
    }

}
