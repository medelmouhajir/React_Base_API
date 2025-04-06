using Microsoft.AspNetCore.Mvc;
using React_Lawyer.DocumentGenerator.Models;
using React_Lawyer.DocumentGenerator.Services;

namespace React_Lawyer.DocumentGenerator.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemplatesController : ControllerBase
    {
        private readonly TemplateService _templateService;
        private readonly ILogger<TemplatesController> _logger;

        public TemplatesController(
            TemplateService templateService,
            ILogger<TemplatesController> logger)
        {
            _templateService = templateService;
            _logger = logger;
        }

        /// <summary>
        /// Get all templates
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Template>>> GetTemplates([FromQuery] string category = null)
        {
            try
            {
                var templates = await _templateService.GetTemplatesAsync(category);
                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting templates");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get a template by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Template>> GetTemplate(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Template ID is required");
                }

                var template = await _templateService.GetTemplateAsync(id);

                return Ok(template);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Template with ID {id} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting template: {TemplateId}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Create a new template
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Template>> CreateTemplate([FromBody] Template template)
        {
            try
            {
                if (template == null)
                {
                    return BadRequest("Template data cannot be null");
                }

                // Ensure we're creating a new template
                template.Id = null;

                var createdTemplate = await _templateService.SaveTemplateAsync(template);

                return CreatedAtAction(nameof(GetTemplate), new { id = createdTemplate.Id }, createdTemplate);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating template");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing template
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTemplate(string id, [FromBody] Template template)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Template ID is required");
                }

                if (template == null)
                {
                    return BadRequest("Template data cannot be null");
                }

                // Ensure the ID in the URL matches the template ID
                if (!string.IsNullOrEmpty(template.Id) && template.Id != id)
                {
                    return BadRequest("Template ID in URL must match template ID in body");
                }

                template.Id = id;

                // Check if the template exists
                await _templateService.GetTemplateAsync(id);

                // Update the template
                var updatedTemplate = await _templateService.SaveTemplateAsync(template);

                return Ok(updatedTemplate);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Template with ID {id} not found");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating template: {TemplateId}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a template
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Template ID is required");
                }

                var result = await _templateService.DeleteTemplateAsync(id);
                if (!result)
                {
                    return NotFound($"Template with ID {id} not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting template: {TemplateId}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Search templates by keyword
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Template>>> SearchTemplates([FromQuery] string keyword)
        {
            try
            {
                if (string.IsNullOrEmpty(keyword))
                {
                    return BadRequest("Search keyword is required");
                }

                var templates = await _templateService.SearchTemplatesAsync(keyword);
                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching templates with keyword: {Keyword}", keyword);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get templates by jurisdiction
        /// </summary>
        [HttpGet("jurisdiction/{jurisdiction}")]
        public async Task<ActionResult<IEnumerable<Template>>> GetTemplatesByJurisdiction(string jurisdiction)
        {
            try
            {
                if (string.IsNullOrEmpty(jurisdiction))
                {
                    return BadRequest("Jurisdiction is required");
                }

                var templates = await _templateService.GetTemplatesByJurisdictionAsync(jurisdiction);
                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting templates for jurisdiction: {Jurisdiction}", jurisdiction);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Create a new version of an existing template
        /// </summary>
        [HttpPost("{id}/versions")]
        public async Task<ActionResult<Template>> CreateTemplateVersion(string id, [FromBody] Template template)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Template ID is required");
                }

                if (template == null)
                {
                    return BadRequest("Template data cannot be null");
                }

                // Set the template ID to match the URL
                template.Id = id;

                var newVersion = await _templateService.CreateTemplateVersionAsync(id, template);

                return CreatedAtAction(nameof(GetTemplate), new { id = newVersion.Id }, newVersion);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Template with ID {id} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating template version: {TemplateId}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
