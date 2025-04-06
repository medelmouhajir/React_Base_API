using Microsoft.AspNetCore.Mvc;
using React_Lawyer.DocumentGenerator.Models.Templates;
using React_Lawyer.DocumentGenerator.Services;

namespace React_Lawyer.DocumentGenerator.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrainingController : ControllerBase
    {
        private readonly TrainingService _trainingService;
        private readonly ILogger<TrainingController> _logger;

        public TrainingController(
            TrainingService trainingService,
            ILogger<TrainingController> logger)
        {
            _trainingService = trainingService;
            _logger = logger;
        }

        /// <summary>
        /// Get all training data sets
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingData>>> GetTrainingData()
        {
            try
            {
                var trainingData = await _trainingService.GetAllTrainingDataAsync();
                return Ok(trainingData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting training data");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get training data by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingData>> GetTrainingData(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Training data ID is required");
                }

                var trainingData = await _trainingService.GetTrainingDataAsync(id);
                if (trainingData == null)
                {
                    return NotFound($"Training data with ID {id} not found");
                }

                return Ok(trainingData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting training data: {Id}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get training data for a template
        /// </summary>
        [HttpGet("template/{templateId}")]
        public async Task<ActionResult<IEnumerable<TrainingData>>> GetTrainingDataForTemplate(string templateId)
        {
            try
            {
                if (string.IsNullOrEmpty(templateId))
                {
                    return BadRequest("Template ID is required");
                }

                var trainingData = await _trainingService.GetTrainingDataForTemplateAsync(templateId);
                return Ok(trainingData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting training data for template: {TemplateId}", templateId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Create new training data
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TrainingData>> CreateTrainingData([FromBody] TrainingData trainingData)
        {
            try
            {
                if (trainingData == null)
                {
                    return BadRequest("Training data cannot be null");
                }

                // Ensure we're creating new training data
                trainingData.Id = null;

                var createdTrainingData = await _trainingService.SaveTrainingDataAsync(trainingData);

                return CreatedAtAction(nameof(GetTrainingData), new { id = createdTrainingData.Id }, createdTrainingData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating training data");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Update training data
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrainingData(string id, [FromBody] TrainingData trainingData)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Training data ID is required");
                }

                if (trainingData == null)
                {
                    return BadRequest("Training data cannot be null");
                }

                // Ensure the ID in the URL matches the training data ID
                if (!string.IsNullOrEmpty(trainingData.Id) && trainingData.Id != id)
                {
                    return BadRequest("Training data ID in URL must match training data ID in body");
                }

                trainingData.Id = id;

                var updatedTrainingData = await _trainingService.SaveTrainingDataAsync(trainingData);

                return Ok(updatedTrainingData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating training data: {Id}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Add an example to training data
        /// </summary>
        [HttpPost("{id}/examples")]
        public async Task<ActionResult<DocumentExample>> AddExample(string id, [FromBody] DocumentExample example)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Training data ID is required");
                }

                if (example == null)
                {
                    return BadRequest("Example cannot be null");
                }

                var addedExample = await _trainingService.AddExampleAsync(id, example);

                return Ok(addedExample);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Training data with ID {id} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding example to training data: {Id}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Remove an example from training data
        /// </summary>
        [HttpDelete("{id}/examples/{exampleId}")]
        public async Task<IActionResult> RemoveExample(string id, string exampleId)
        {
            try
            {
                if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(exampleId))
                {
                    return BadRequest("Training data ID and example ID are required");
                }

                var result = await _trainingService.RemoveExampleAsync(id, exampleId);
                if (!result)
                {
                    return NotFound($"Training data with ID {id} or example with ID {exampleId} not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing example {ExampleId} from training data: {Id}", exampleId, id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Start fine-tuning for a training set
        /// </summary>
        [HttpPost("{id}/finetune")]
        public async Task<IActionResult> StartFineTuning(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Training data ID is required");
                }

                var result = await _trainingService.StartFineTuningAsync(id);
                if (result)
                {
                    return Accepted();
                }
                else
                {
                    return StatusCode(500, new { error = "Fine-tuning failed to start" });
                }
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Training data with ID {id} not found");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting fine-tuning for training data: {Id}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
