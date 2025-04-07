using DocumentGeneratorAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentGeneratorAPI.Data.Repositories
{
    public interface ITemplateRepository
    {
        Task<Template> GetByIdAsync(string id);
        Task<IEnumerable<Template>> GetAllAsync(string category = null);
        Task<Template> SaveAsync(Template template);
        Task<bool> DeleteAsync(string id);
        Task<IEnumerable<Template>> SearchAsync(string keyword);
    }

    public class TemplateRepository : ITemplateRepository
    {
        private readonly ApplicationDbContext _context;

        public TemplateRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get a template by ID
        /// </summary>
        public async Task<Template> GetByIdAsync(string id)
        {
            return await _context.Templates
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        /// <summary>
        /// Get all templates, optionally filtered by category
        /// </summary>
        public async Task<IEnumerable<Template>> GetAllAsync(string category = null)
        {
            var query = _context.Templates
                .Where(t => t.IsActive);

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(t => t.Category == category);
            }

            return await query.OrderBy(t => t.Name).ToListAsync();
        }

        /// <summary>
        /// Save a template (create or update)
        /// </summary>
        public async Task<Template> SaveAsync(Template template)
        {
            var existing = await _context.Templates
                .FirstOrDefaultAsync(t => t.Id == template.Id);

            if (existing == null)
            {
                // New template
                _context.Templates.Add(template);
            }
            else
            {
                // Update existing template
                _context.Entry(existing).CurrentValues.SetValues(template);
            }

            await _context.SaveChangesAsync();
            return template;
        }

        /// <summary>
        /// Delete a template (soft delete by marking inactive)
        /// </summary>
        public async Task<bool> DeleteAsync(string id)
        {
            var template = await _context.Templates.FindAsync(id);
            if (template == null)
            {
                return false;
            }

            template.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Search templates by keyword
        /// </summary>
        public async Task<IEnumerable<Template>> SearchAsync(string keyword)
        {
            if (string.IsNullOrEmpty(keyword))
            {
                return await GetAllAsync();
            }

            return await _context.Templates
                .Where(t => t.IsActive &&
                           (t.Name.Contains(keyword) ||
                            t.Description.Contains(keyword) ||
                            t.Category.Contains(keyword)))
                .OrderBy(t => t.Name)
                .ToListAsync();
        }
    }
}