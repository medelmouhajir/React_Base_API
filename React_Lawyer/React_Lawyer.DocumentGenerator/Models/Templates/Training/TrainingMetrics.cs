namespace React_Lawyer.DocumentGenerator.Models.Templates.Training
{
    public class TrainingMetrics
    {
        /// <summary>
        /// Accuracy measure
        /// </summary>
        public double Accuracy { get; set; }

        /// <summary>
        /// Consistency measure
        /// </summary>
        public double Consistency { get; set; }

        /// <summary>
        /// Number of examples used
        /// </summary>
        public int ExamplesCount { get; set; }

        /// <summary>
        /// Training duration
        /// </summary>
        public TimeSpan TrainingDuration { get; set; }

        /// <summary>
        /// Number of training iterations
        /// </summary>
        public int Iterations { get; set; }

        /// <summary>
        /// Loss value at end of training
        /// </summary>
        public double FinalLoss { get; set; }
    }

    public enum TrainingStatus
    {
        Draft,
        Ready,
        Training,
        Trained,
        Failed
    }
}
