using Microsoft.EntityFrameworkCore;
using React_Lawyer.DocumentGenerator.Data.Context;
using React_Lawyer.DocumentGenerator.Models;

namespace React_Lawyer.DocumentGenerator.Data
{
    public interface ITemplateRepository
    {
        Task<Template> GetByIdAsync(string id);
        Task<IEnumerable<Template>> GetAllAsync(string category = null);
        Task<Template> SaveAsync(Template template);
        Task<bool> DeleteAsync(string id);
        Task<IEnumerable<Template>> SearchAsync(string keyword);
        Task<IEnumerable<Template>> GetByFirmAsync(int firmId);
        Task<Template> GetLatestVersionAsync(string templateId);
        Task<Template> CreateVersionAsync(Template template);
    }

    /// <summary>
    /// Implementation of template repository using EF Core
    /// </summary>
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

        /// <summary>
        /// Get templates by law firm ID
        /// </summary>
        public async Task<IEnumerable<Template>> GetByFirmAsync(int firmId)
        {
            // This assumes templates have a property that links them to firms
            // You may need to adjust this based on your actual data model
            return await _context.Templates
                .Where(t => t.IsActive /* && t.FirmId == firmId */)
                .OrderBy(t => t.Name)
                .ToListAsync();
        }

        /// <summary>
        /// Get the latest version of a template
        /// </summary>
        public async Task<Template> GetLatestVersionAsync(string templateId)
        {
            // This assumes templates have some kind of versioning system
            // Adjust based on your actual versioning implementation
            return await _context.Templates
                .Where(t => t.Id == templateId && t.IsActive)
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Create a new version of an existing template
        /// </summary>
        public async Task<Template> CreateVersionAsync(Template template)
        {
            // Get the latest version
            var latestVersion = await GetLatestVersionAsync(template.Id);

            if (latestVersion == null)
            {
                throw new InvalidOperationException("Template not found");
            }

            // Create a new template as a copy with incremented version
            var newVersion = new Template
            {
                Id = Guid.NewGuid().ToString(), // New ID for the new version
                Name = latestVersion.Name,
                Description = latestVersion.Description,
                Category = latestVersion.Category,
                Content = template.Content,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                IsFineTuned = latestVersion.IsFineTuned,
                GenerationInstructions = template.GenerationInstructions,
                Language = latestVersion.Language,
                Jurisdiction = latestVersion.Jurisdiction
            };

            _context.Templates.Add(newVersion);
            await _context.SaveChangesAsync();
            return newVersion;
        }
    }
}
