using DocumentGeneratorAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentGeneratorAPI.Data.Repositories
{
    public interface IDocumentRepository
    {
        Task<Document> GetByIdAsync(string id);
        Task<IEnumerable<Document>> GetAllAsync();
        Task<Document> SaveAsync(Document document);
        Task<bool> DeleteAsync(string id);
        Task<IEnumerable<Document>> SearchAsync(string keyword);
        Task<IEnumerable<Document>> GetByTemplateIdAsync(string templateId);
    }

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
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        /// <summary>
        /// Get all documents
        /// </summary>
        public async Task<IEnumerable<Document>> GetAllAsync()
        {
            return await _context.Documents
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
                _context.Entry(existing).CurrentValues.SetValues(document);
            }

            await _context.SaveChangesAsync();
            return document;
        }

        /// <summary>
        /// Delete a document
        /// </summary>
        public async Task<bool> DeleteAsync(string id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return false;
            }

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
            return true;
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
                .Where(d => d.Title.Contains(keyword))
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Get documents by template ID
        /// </summary>
        public async Task<IEnumerable<Document>> GetByTemplateIdAsync(string templateId)
        {
            return await _context.Documents
                .Where(d => d.TemplateId == templateId)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
        }
    }
}