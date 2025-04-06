using React_Lawyer.DocumentGenerator.Data;
using React_Lawyer.DocumentGenerator.Models;

namespace React_Lawyer.DocumentGenerator.Services
{

    public class TemplateService
    {
        private readonly ITemplateRepository _templateRepository;
        private readonly ILogger<TemplateService> _logger;

        public TemplateService(
            ITemplateRepository templateRepository,
            ILogger<TemplateService> logger)
        {
            _templateRepository = templateRepository;
            _logger = logger;
        }

        /// <summary>
        /// Get a template by ID
        /// </summary>
        public async Task<Template> GetTemplateAsync(string templateId)
        {
            if (string.IsNullOrEmpty(templateId))
            {
                throw new ArgumentException("Template ID cannot be null or empty", nameof(templateId));
            }

            var template = await _templateRepository.GetByIdAsync(templateId);

            if (template == null)
            {
                _logger.LogWarning("Template not found: {TemplateId}", templateId);
                throw new KeyNotFoundException($"Template with ID {templateId} was not found");
            }

            return template;
        }

        /// <summary>
        /// Get all templates, optionally filtered by category
        /// </summary>
        public async Task<IEnumerable<Template>> GetTemplatesAsync(string category = null)
        {
            return await _templateRepository.GetAllAsync(category);
        }

        /// <summary>
        /// Save a template (create or update)
        /// </summary>
        public async Task<Template> SaveTemplateAsync(Template template)
        {
            if (template == null)
            {
                throw new ArgumentNullException(nameof(template));
            }

            ValidateTemplate(template);

            if (string.IsNullOrEmpty(template.Id))
            {
                template.Id = Guid.NewGuid().ToString();
                template.CreatedAt = DateTime.UtcNow;
                _logger.LogInformation("Creating new template: {TemplateName}", template.Name);
            }
            else
            {
                _logger.LogInformation("Updating template: {TemplateName} ({TemplateId})", template.Name, template.Id);
            }

            template.UpdatedAt = DateTime.UtcNow;

            return await _templateRepository.SaveAsync(template);
        }

        /// <summary>
        /// Delete a template
        /// </summary>
        public async Task<bool> DeleteTemplateAsync(string templateId)
        {
            if (string.IsNullOrEmpty(templateId))
            {
                throw new ArgumentException("Template ID cannot be null or empty", nameof(templateId));
            }

            var template = await _templateRepository.GetByIdAsync(templateId);
            if (template == null)
            {
                _logger.LogWarning("Attempt to delete non-existent template: {TemplateId}", templateId);
                return false;
            }

            _logger.LogInformation("Deleting template: {TemplateName} ({TemplateId})", template.Name, templateId);
            return await _templateRepository.DeleteAsync(templateId);
        }

        /// <summary>
        /// Search templates by keyword
        /// </summary>
        public async Task<IEnumerable<Template>> SearchTemplatesAsync(string keyword)
        {
            return await _templateRepository.SearchAsync(keyword);
        }

        /// <summary>
        /// Create a new version of an existing template
        /// </summary>
        public async Task<Template> CreateTemplateVersionAsync(string templateId, Template updatedTemplate)
        {
            if (string.IsNullOrEmpty(templateId))
            {
                throw new ArgumentException("Template ID cannot be null or empty", nameof(templateId));
            }

            if (updatedTemplate == null)
            {
                throw new ArgumentNullException(nameof(updatedTemplate));
            }

            var existingTemplate = await _templateRepository.GetByIdAsync(templateId);
            if (existingTemplate == null)
            {
                throw new KeyNotFoundException($"Template with ID {templateId} was not found");
            }

            _logger.LogInformation("Creating new version of template: {TemplateName} ({TemplateId})",
                existingTemplate.Name, templateId);

            return await _templateRepository.CreateVersionAsync(updatedTemplate);
        }

        /// <summary>
        /// Get templates by jurisdiction
        /// </summary>
        public async Task<IEnumerable<Template>> GetTemplatesByJurisdictionAsync(string jurisdiction)
        {
            if (string.IsNullOrEmpty(jurisdiction))
            {
                throw new ArgumentException("Jurisdiction cannot be null or empty", nameof(jurisdiction));
            }

            var allTemplates = await _templateRepository.GetAllAsync();
            return allTemplates.Where(t => t.Jurisdiction == jurisdiction);
        }

        /// <summary>
        /// Get templates by law firm
        /// </summary>
        public async Task<IEnumerable<Template>> GetTemplatesByFirmAsync(int firmId)
        {
            return await _templateRepository.GetByFirmAsync(firmId);
        }

        /// <summary>
        /// Validate a template's structure and required fields
        /// </summary>
        private void ValidateTemplate(Template template)
        {
            if (string.IsNullOrEmpty(template.Name))
            {
                throw new ArgumentException("Template name is required");
            }

            if (string.IsNullOrEmpty(template.Category))
            {
                throw new ArgumentException("Template category is required");
            }

            if (string.IsNullOrEmpty(template.Content))
            {
                throw new ArgumentException("Template content is required");
            }

            // Validate that all variables in content have definitions
            var contentVariables = ExtractVariablesFromContent(template.Content);
            var definedVariables = template.Variables.Select(v => v.Name).ToHashSet();

            var undefinedVariables = contentVariables.Except(definedVariables).ToList();
            if (undefinedVariables.Any())
            {
                _logger.LogWarning(
                    "Template {TemplateName} has variables in content that are not defined: {UndefinedVariables}",
                    template.Name,
                    string.Join(", ", undefinedVariables));
            }
        }

        /// <summary>
        /// Extract variable placeholders from template content
        /// </summary>
        private IEnumerable<string> ExtractVariablesFromContent(string content)
        {
            var variables = new HashSet<string>();

            // Match patterns like {{VariableName}}
            var matches = System.Text.RegularExpressions.Regex.Matches(
                content,
                @"\{\{([^}]+)\}\}"
            );

            foreach (System.Text.RegularExpressions.Match match in matches)
            {
                if (match.Groups.Count > 1)
                {
                    variables.Add(match.Groups[1].Value.Trim());
                }
            }

            return variables;
        }
    }
}
