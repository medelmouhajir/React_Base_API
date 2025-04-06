namespace React_Lawyer.DocumentGenerator.Models
{
    public class GenerationStats
    {
        /// <summary>
        /// Time taken to generate the document (in ms)
        /// </summary>
        public long ProcessingTimeMs { get; set; }

        /// <summary>
        /// Number of variables replaced
        /// </summary>
        public int VariablesReplaced { get; set; }

        /// <summary>
        /// Number of tokens processed by Gemini
        /// </summary>
        public int TokensProcessed { get; set; }

        /// <summary>
        /// Model version used for generation
        /// </summary>
        public string ModelVersion { get; set; }
    }

}
