using Microsoft.EntityFrameworkCore;
using React_Lawyer.DocumentGenerator.Data.Context;
using React_Lawyer.DocumentGenerator.Models;

namespace React_Lawyer.DocumentGenerator.Data
{
    public interface IDocumentRepository
    {
        Task<Document> GetByIdAsync(string id);
        Task<IEnumerable<Document>> GetAllAsync();
        Task<Document> SaveAsync(Document document);
        Task<bool> DeleteAsync(string id);
        Task<IEnumerable<Document>> GetByClientAsync(int clientId);
        Task<IEnumerable<Document>> GetByCaseAsync(int caseId);
        Task<IEnumerable<Document>> GetByFirmAsync(int firmId);
        Task<IEnumerable<Document>> SearchAsync(string keyword);
        Task<bool> FinalizeAsync(string id);
        Task<bool> ShareWithClientAsync(string id, bool share);
    }

    /// <summary>
    /// Implementation of document repository using EF Core
    /// </summary>
    public class DocumentRepository : IDocumentRepository
    {
        private readonly ApplicationDbContext _context;

        public DocumentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get a document by ID
        /// </summary>
        public async Task<Document> GetByIdAsync(string id)
        {
            return await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == id && d.Status != DocumentStatus.Deleted);
        }

        /// <summary>
        /// Get all documents
        /// </summary>
        public async Task<IEnumerable<Document>> GetAllAsync()
        {
            return await _context.Documents
                .Where(d => d.Status != DocumentStatus.Deleted)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Save a document (create or update)
        /// </summary>
        public async Task<Document> SaveAsync(Document document)
        {
            var existing = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == document.Id);

            if (existing == null)
            {
                // New document
                _context.Documents.Add(document);
            }
            else
            {
                // Update existing document
                if (existing.IsFinalized)
                {
                    throw new InvalidOperationException("Cannot modify a finalized document");
                }

                _context.Entry(existing).CurrentValues.SetValues(document);
            }

            await _context.SaveChangesAsync();
            return document;
        }

        /// <summary>
        /// Delete a document (soft delete by marking as deleted)
        /// </summary>
        public async Task<bool> DeleteAsync(string id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return false;
            }

            document.Status = DocumentStatus.Deleted;
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Get documents by client ID
        /// </summary>
        public async Task<IEnumerable<Document>> GetByClientAsync(int clientId)
        {
            return await _context.Documents
                .Where(d => d.ClientId == clientId && d.Status != DocumentStatus.Deleted)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Get documents by case ID
        /// </summary>
        public async Task<IEnumerable<Document>> GetByCaseAsync(int caseId)
        {
            return await _context.Documents
                .Where(d => d.CaseId == caseId && d.Status != DocumentStatus.Deleted)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Get documents by firm ID
        /// </summary>
        public async Task<IEnumerable<Document>> GetByFirmAsync(int firmId)
        {
            return await _context.Documents
                .Where(d => d.LawFirmId == firmId && d.Status != DocumentStatus.Deleted)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Search documents by keyword
        /// </summary>
        public async Task<IEnumerable<Document>> SearchAsync(string keyword)
        {
            if (string.IsNullOrEmpty(keyword))
            {
                return await GetAllAsync();
            }

            return await _context.Documents
                .Where(d => d.Status != DocumentStatus.Deleted &&
                           (d.Title.Contains(keyword) ||
                            d.TemplateName.Contains(keyword) ||
                            d.Tags.Any(t => t.Contains(keyword))))
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Finalize a document (mark as final and prevent further modifications)
        /// </summary>
        public async Task<bool> FinalizeAsync(string id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null || document.Status == DocumentStatus.Deleted)
            {
                return false;
            }

            document.IsFinalized = true;
            document.Status = DocumentStatus.Final;
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Share a document with a client or unshare it
        /// </summary>
        public async Task<bool> ShareWithClientAsync(string id, bool share)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null || document.Status == DocumentStatus.Deleted)
            {
                return false;
            }

            document.IsSharedWithClient = share;
            if (share)
            {
                document.SharedAt = DateTime.UtcNow;
            }
            else
            {
                document.SharedAt = null;
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
