using DocumentGeneratorAPI.Services;
using Microsoft.AspNetCore.Mvc;
using React_Lawyer.DocumentGenerator.Models.Extras;

namespace React_Lawyer.DocumentGenerator.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmartEditorController : ControllerBase
    {
        private readonly ILogger<SmartEditorController> _logger;
        private readonly EnhancedGeminiService _enhancedGeminiService;

        public SmartEditorController(
            ILogger<SmartEditorController> logger,
            EnhancedGeminiService enhancedGeminiService)
        {
            _logger = logger;
            _enhancedGeminiService = enhancedGeminiService;
        }



        [HttpPost("check-spelling-syntax")]
        public async Task<ActionResult<GenerationResponse>> CheckSpellingAndSyntaxAsync([FromBody] TypeARequest request)
        {
            try
            {
                var result = await _enhancedGeminiService.CheckSpellingAndSyntaxAsync(request.Content, request.Language);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking spelling and syntax");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("suggest-phrasing")]
        public async Task<ActionResult<GenerationResponse>> SuggestElegantPhrasingAsync([FromBody] TypeARequest request)
        {
            try
            {
                var result = await _enhancedGeminiService.SuggestElegantPhrasingAsync(request.Content, request.Language);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking spelling and syntax");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPost("document-translation")]
        public async Task<ActionResult<string>> TranslateDocumentAsync([FromBody] TypeARequest request)
        {
            try
            {
                var result = await _enhancedGeminiService.TranslateDocumentAsync(request.Content, request.Language);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking spelling and syntax");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPost("document-summarize")]
        public async Task<ActionResult<string>> SummarizeDocumentAsync([FromBody] TypeBRequest request)
        {
            try
            {
                var result = await _enhancedGeminiService.SummarizeDocumentAsync(request.Content, request.Lenght);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking spelling and syntax");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPost("suggest-entity-integration")]
        public async Task<ActionResult<string>> SuggestEntityInfoIntegrationAsync([FromBody] TypeCRequest request)
        {
            try
            {
                var result = await _enhancedGeminiService.SuggestEntityInfoIntegrationAsync(request.content, request.clientData , request.caseData);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking spelling and syntax");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpPost("document-completion")]
        public async Task<ActionResult<string>> GenerateCompletionAsync([FromBody] string request)
        {
            try
            {
                var result = await _enhancedGeminiService.GenerateCompletionAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking spelling and syntax");
                return StatusCode(500, "Internal server error");
            }
        }
    }

    public class TypeARequest
    {
        public string Content { get; set; }
        public string Language { get; set; }
    }
    public class TypeBRequest
    {
        public string Content { get; set; }
        public int Lenght { get; set; }
    }
    public class TypeCRequest
    {
        public string content { get; set; }
        public object? clientData { get; set; }
        public object? caseData { get; set; }
    }
}
