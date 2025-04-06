using React_Lawyer.DocumentGenerator.Data;
using React_Lawyer.DocumentGenerator.Models.Templates.Training;
using React_Lawyer.DocumentGenerator.Models.Templates;

namespace React_Lawyer.DocumentGenerator.Services
{
    public class TrainingService
    {
        private readonly ITrainingDataRepository _trainingRepository;
        private readonly GeminiService _geminiService;
        private readonly ILogger<TrainingService> _logger;

        public TrainingService(
            ITrainingDataRepository trainingRepository,
            GeminiService geminiService,
            ILogger<TrainingService> logger)
        {
            _trainingRepository = trainingRepository;
            _geminiService = geminiService;
            _logger = logger;
        }

        /// <summary>
        /// Get training data by ID
        /// </summary>
        public async Task<TrainingData> GetTrainingDataAsync(string id)
        {
            return await _trainingRepository.GetByIdAsync(id);
        }

        /// <summary>
        /// Get all training data sets
        /// </summary>
        public async Task<IEnumerable<TrainingData>> GetAllTrainingDataAsync()
        {
            return await _trainingRepository.GetAllAsync();
        }

        /// <summary>
        /// Get training data for a specific template
        /// </summary>
        public async Task<IEnumerable<TrainingData>> GetTrainingDataForTemplateAsync(string templateId)
        {
            return await _trainingRepository.GetByTemplateAsync(templateId);
        }

        /// <summary>
        /// Save training data
        /// </summary>
        public async Task<TrainingData> SaveTrainingDataAsync(TrainingData trainingData)
        {
            if (string.IsNullOrEmpty(trainingData.Id))
            {
                trainingData.Id = Guid.NewGuid().ToString();
                trainingData.CreatedAt = DateTime.UtcNow;
                _logger.LogInformation("Creating new training data: {Name}", trainingData.Name);
            }
            else
            {
                _logger.LogInformation("Updating training data: {Name} ({Id})", trainingData.Name, trainingData.Id);
            }

            trainingData.UpdatedAt = DateTime.UtcNow;
            return await _trainingRepository.SaveAsync(trainingData);
        }

        /// <summary>
        /// Add an example to training data
        /// </summary>
        public async Task<DocumentExample> AddExampleAsync(string trainingDataId, DocumentExample example)
        {
            _logger.LogInformation("Adding example to training data: {TrainingDataId}", trainingDataId);

            if (string.IsNullOrEmpty(example.Id))
            {
                example.Id = Guid.NewGuid().ToString();
            }

            example.AddedAt = DateTime.UtcNow;

            return await _trainingRepository.AddExampleAsync(trainingDataId, example);
        }

        /// <summary>
        /// Remove an example from training data
        /// </summary>
        public async Task<bool> RemoveExampleAsync(string trainingDataId, string exampleId)
        {
            _logger.LogInformation("Removing example {ExampleId} from training data: {TrainingDataId}",
                exampleId, trainingDataId);

            return await _trainingRepository.RemoveExampleAsync(trainingDataId, exampleId);
        }

        /// <summary>
        /// Start the fine-tuning process for a training set
        /// </summary>
        public async Task<bool> StartFineTuningAsync(string trainingDataId)
        {
            var trainingData = await _trainingRepository.GetByIdAsync(trainingDataId);
            if (trainingData == null)
            {
                throw new KeyNotFoundException($"Training data with ID {trainingDataId} not found");
            }

            if (trainingData.Examples.Count < 3)
            {
                throw new InvalidOperationException("At least 3 examples are required for fine-tuning");
            }

            _logger.LogInformation("Starting fine-tuning for training data: {Name} ({Id})",
                trainingData.Name, trainingData.Id);

            // Update status to training
            await _trainingRepository.UpdateStatusAsync(trainingDataId, TrainingStatus.Training);

            try
            {
                // Call Gemini service to fine-tune the model
                var success = await _geminiService.FineTuneModelAsync(trainingData);

                if (success)
                {
                    // Update status to trained
                    await _trainingRepository.UpdateStatusAsync(trainingDataId, TrainingStatus.Trained);

                    // Update metrics
                    var metrics = new TrainingMetrics
                    {
                        Accuracy = 0.95, // Sample values
                        Consistency = 0.92,
                        ExamplesCount = trainingData.Examples.Count,
                        TrainingDuration = TimeSpan.FromMinutes(5),
                        Iterations = 100,
                        FinalLoss = 0.02
                    };

                    await _trainingRepository.UpdateMetricsAsync(trainingDataId, metrics);

                    return true;
                }
                else
                {
                    // Update status to failed
                    await _trainingRepository.UpdateStatusAsync(trainingDataId, TrainingStatus.Failed);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during fine-tuning for training data: {Id}", trainingDataId);
                await _trainingRepository.UpdateStatusAsync(trainingDataId, TrainingStatus.Failed);
                throw;
            }
        }
    }
}
