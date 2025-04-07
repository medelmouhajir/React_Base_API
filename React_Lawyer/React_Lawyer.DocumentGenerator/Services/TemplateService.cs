using DocumentGeneratorAPI.Data.Repositories;
using DocumentGeneratorAPI.Models;

namespace DocumentGeneratorAPI.Services
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

            // Validate the template
            if (string.IsNullOrEmpty(template.Name))
            {
                throw new ArgumentException("Template name is required");
            }

            if (string.IsNullOrEmpty(template.Content))
            {
                throw new ArgumentException("Template content is required");
            }

            // Extract variables from the template content for validation
            var variables = ExtractVariablesFromContent(template.Content);
            _logger.LogInformation("Template {TemplateId} contains {VariableCount} variables: {Variables}",
                template.Id, variables.Count(), string.Join(", ", variables));

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
        /// Extract variable placeholders from template content
        /// </summary>
        public IEnumerable<string> ExtractVariablesFromContent(string content)
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

        /// <summary>
        /// Validate that all required variables have values
        /// </summary>
        public (bool isValid, IEnumerable<string> missingVariables) ValidateVariables(string templateContent, Dictionary<string, string> variables)
        {
            var requiredVariables = ExtractVariablesFromContent(templateContent);
            var missingVariables = requiredVariables.Where(v => !variables.ContainsKey(v) || string.IsNullOrEmpty(variables[v]));

            return (missingVariables.Count() == 0, missingVariables);
        }
    }
}