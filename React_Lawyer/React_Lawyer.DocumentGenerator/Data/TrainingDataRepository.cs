using React_Lawyer.DocumentGenerator.Data.Context;
using React_Lawyer.DocumentGenerator.Models.Templates.Training;
using React_Lawyer.DocumentGenerator.Models.Templates;
using Microsoft.EntityFrameworkCore;

namespace React_Lawyer.DocumentGenerator.Data
{
    public interface ITrainingDataRepository
    {
        Task<TrainingData> GetByIdAsync(string id);
        Task<IEnumerable<TrainingData>> GetAllAsync();
        Task<TrainingData> SaveAsync(TrainingData trainingData);
        Task<bool> DeleteAsync(string id);
        Task<IEnumerable<TrainingData>> GetByTemplateAsync(string templateId);
        Task<IEnumerable<TrainingData>> GetByCategoryAsync(string category);
        Task<DocumentExample> AddExampleAsync(string trainingDataId, DocumentExample example);
        Task<bool> RemoveExampleAsync(string trainingDataId, string exampleId);
        Task<bool> UpdateStatusAsync(string id, TrainingStatus status);
        Task<bool> UpdateMetricsAsync(string id, TrainingMetrics metrics);
    }

    /// <summary>
    /// Implementation of training data repository using EF Core
    /// </summary>
    public class TrainingDataRepository : ITrainingDataRepository
    {
        private readonly ApplicationDbContext _context;

        public TrainingDataRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get training data by ID
        /// </summary>
        public async Task<TrainingData> GetByIdAsync(string id)
        {
            return await _context.TrainingData
                .Include(t => t.Examples)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        /// <summary>
        /// Get all training data sets
        /// </summary>
        public async Task<IEnumerable<TrainingData>> GetAllAsync()
        {
            return await _context.TrainingData
                .Include(t => t.Examples)
                .Where(t => t.IsActive)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        /// <summary>
        /// Save training data (create or update)
        /// </summary>
        public async Task<TrainingData> SaveAsync(TrainingData trainingData)
        {
            var existing = await _context.TrainingData
                .Include(t => t.Examples)
                .FirstOrDefaultAsync(t => t.Id == trainingData.Id);

            if (existing == null)
            {
                // New training data
                _context.TrainingData.Add(trainingData);
            }
            else
            {
                // Update existing training data
                _context.Entry(existing).CurrentValues.SetValues(trainingData);

                // Handle examples collection
                if (trainingData.Examples != null)
                {
                    // Remove examples not in the updated collection
                    foreach (var existingExample in existing.Examples.ToList())
                    {
                        if (!trainingData.Examples.Any(e => e.Id == existingExample.Id))
                        {
                            existing.Examples.Remove(existingExample);
                        }
                    }

                    // Add new examples and update existing ones
                    foreach (var example in trainingData.Examples)
                    {
                        var existingExample = existing.Examples.FirstOrDefault(e => e.Id == example.Id);
                        if (existingExample == null)
                        {
                            existing.Examples.Add(example);
                        }
                        else
                        {
                            _context.Entry(existingExample).CurrentValues.SetValues(example);
                        }
                    }
                }
            }

            trainingData.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return trainingData;
        }

        /// <summary>
        /// Delete training data (soft delete by marking inactive)
        /// </summary>
        public async Task<bool> DeleteAsync(string id)
        {
            var trainingData = await _context.TrainingData.FindAsync(id);
            if (trainingData == null)
            {
                return false;
            }

            trainingData.IsActive = false;
            trainingData.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Get training data by template ID
        /// </summary>
        public async Task<IEnumerable<TrainingData>> GetByTemplateAsync(string templateId)
        {
            return await _context.TrainingData
                .Include(t => t.Examples)
                .Where(t => t.TemplateId == templateId && t.IsActive)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        /// <summary>
        /// Get training data by category
        /// </summary>
        public async Task<IEnumerable<TrainingData>> GetByCategoryAsync(string category)
        {
            return await _context.TrainingData
                .Include(t => t.Examples)
                .Where(t => t.Category == category && t.IsActive)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        /// <summary>
        /// Add a document example to training data
        /// </summary>
        public async Task<DocumentExample> AddExampleAsync(string trainingDataId, DocumentExample example)
        {
            var trainingData = await _context.TrainingData
                .Include(t => t.Examples)
                .FirstOrDefaultAsync(t => t.Id == trainingDataId);

            if (trainingData == null)
            {
                throw new KeyNotFoundException($"Training data with ID {trainingDataId} not found");
            }

            trainingData.Examples.Add(example);
            trainingData.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return example;
        }

        /// <summary>
        /// Remove a document example from training data
        /// </summary>
        public async Task<bool> RemoveExampleAsync(string trainingDataId, string exampleId)
        {
            var trainingData = await _context.TrainingData
                .Include(t => t.Examples)
                .FirstOrDefaultAsync(t => t.Id == trainingDataId);

            if (trainingData == null)
            {
                return false;
            }

            var example = trainingData.Examples.FirstOrDefault(e => e.Id == exampleId);
            if (example == null)
            {
                return false;
            }

            trainingData.Examples.Remove(example);
            trainingData.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Update training data status
        /// </summary>
        public async Task<bool> UpdateStatusAsync(string id, TrainingStatus status)
        {
            var trainingData = await _context.TrainingData.FindAsync(id);
            if (trainingData == null)
            {
                return false;
            }

            trainingData.Status = status;
            trainingData.UpdatedAt = DateTime.UtcNow;

            if (status == TrainingStatus.Trained)
            {
                trainingData.LastTrainedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Update training metrics
        /// </summary>
        public async Task<bool> UpdateMetricsAsync(string id, TrainingMetrics metrics)
        {
            var trainingData = await _context.TrainingData.FindAsync(id);
            if (trainingData == null)
            {
                return false;
            }

            trainingData.Metrics = metrics;
            trainingData.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
