using React_Lawyer.DocumentGenerator.Data.Context;
using React_Lawyer.DocumentGenerator.Models.Templates.Gemini;
using React_Lawyer.DocumentGenerator.Models;
using Microsoft.EntityFrameworkCore;

namespace React_Lawyer.DocumentGenerator.Data
{
    public interface IGenerationJobRepository
    {
        Task<GenerationJob> GetByIdAsync(string id);
        Task<IEnumerable<GenerationJob>> GetPendingJobsAsync(int limit = 10);
        Task<GenerationJob> SaveAsync(GenerationJob job);
        Task<bool> UpdateStatusAsync(string id, GenerationStatus status, string error = null);
        Task<bool> UpdateProgressAsync(string id, int progress);
        Task<bool> AddLogAsync(string id, string logEntry);
        Task<bool> SetDocumentIdAsync(string id, string documentId);
        Task<IEnumerable<GenerationJob>> GetByClientIdAsync(int clientId);
        Task<IEnumerable<GenerationJob>> GetByCaseIdAsync(int caseId);
    }

    /// <summary>
    /// Implementation of generation job repository using EF Core
    /// </summary>
    public class GenerationJobRepository : IGenerationJobRepository
    {
        private readonly ApplicationDbContext _context;

        public GenerationJobRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get a job by ID
        /// </summary>
        public async Task<GenerationJob> GetByIdAsync(string id)
        {
            return await _context.GenerationJobs
                .Include(j => j.Request)
                .FirstOrDefaultAsync(j => j.Id == id);
        }

        /// <summary>
        /// Get pending jobs for processing
        /// </summary>
        public async Task<IEnumerable<GenerationJob>> GetPendingJobsAsync(int limit = 10)
        {
            return await _context.GenerationJobs
                .Include(j => j.Request)
                .Where(j => j.Status == GenerationStatus.Queued)
                .OrderByDescending(j => j.Priority)
                .ThenBy(j => j.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        /// <summary>
        /// Save a job (create or update)
        /// </summary>
        public async Task<GenerationJob> SaveAsync(GenerationJob job)
        {
            var existing = await _context.GenerationJobs
                .FirstOrDefaultAsync(j => j.Id == job.Id);

            if (existing == null)
            {
                // New job
                _context.GenerationJobs.Add(job);
            }
            else
            {
                // Update existing job
                _context.Entry(existing).CurrentValues.SetValues(job);
            }

            await _context.SaveChangesAsync();
            return job;
        }

        /// <summary>
        /// Update job status
        /// </summary>
        public async Task<bool> UpdateStatusAsync(string id, GenerationStatus status, string error = null)
        {
            var job = await _context.GenerationJobs.FindAsync(id);
            if (job == null)
            {
                return false;
            }

            job.Status = status;

            if (status == GenerationStatus.Processing && job.StartedAt == null)
            {
                job.StartedAt = DateTime.UtcNow;
            }
            else if (status == GenerationStatus.Completed || status == GenerationStatus.Failed)
            {
                job.CompletedAt = DateTime.UtcNow;
            }

            if (error != null)
            {
                job.Error = error;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Update job progress
        /// </summary>
        public async Task<bool> UpdateProgressAsync(string id, int progress)
        {
            var job = await _context.GenerationJobs.FindAsync(id);
            if (job == null)
            {
                return false;
            }

            job.Progress = Math.Clamp(progress, 0, 100);
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Add a log entry to the job
        /// </summary>
        public async Task<bool> AddLogAsync(string id, string logEntry)
        {
            var job = await _context.GenerationJobs.FindAsync(id);
            if (job == null)
            {
                return false;
            }

            job.Logs.Add($"[{DateTime.UtcNow:u}] {logEntry}");
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Set the document ID for a completed job
        /// </summary>
        public async Task<bool> SetDocumentIdAsync(string id, string documentId)
        {
            var job = await _context.GenerationJobs.FindAsync(id);
            if (job == null)
            {
                return false;
            }

            job.DocumentId = documentId;
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Get jobs by client ID
        /// </summary>
        public async Task<IEnumerable<GenerationJob>> GetByClientIdAsync(int clientId)
        {
            return await _context.GenerationJobs
                .Include(j => j.Request)
                .Where(j => j.Request.ClientId == clientId)
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Get jobs by case ID
        /// </summary>
        public async Task<IEnumerable<GenerationJob>> GetByCaseIdAsync(int caseId)
        {
            return await _context.GenerationJobs
                .Include(j => j.Request)
                .Where(j => j.Request.CaseId == caseId)
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();
        }
    }
}
