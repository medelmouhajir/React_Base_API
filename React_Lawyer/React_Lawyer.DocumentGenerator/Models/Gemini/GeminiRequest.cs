using System.Text.Json.Serialization;

namespace DocumentGeneratorAPI.Models.Gemini
{
    public class GeminiRequest
    {
        /// <summary>
        /// Array of content parts for the request
        /// </summary>
        [JsonPropertyName("contents")]
        public List<ContentPart> Contents { get; set; } = new List<ContentPart>();

        /// <summary>
        /// Safety settings to apply to the request
        /// </summary>
        [JsonPropertyName("safetySettings")]
        public List<SafetySetting> SafetySettings { get; set; } = new List<SafetySetting>();

        /// <summary>
        /// Generation settings for the response
        /// </summary>
        [JsonPropertyName("generationConfig")]
        public GenerationConfig GenerationConfig { get; set; } = new GenerationConfig();
    }

    /// <summary>
    /// Content part of a Gemini request
    /// </summary>
    public class ContentPart
    {
        /// <summary>
        /// The role that produced the content (user or model)
        /// </summary>
        [JsonPropertyName("role")]
        public string Role { get; set; } = "user";

        /// <summary>
        /// List of content parts (text, etc.)
        /// </summary>
        [JsonPropertyName("parts")]
        public List<Part> Parts { get; set; } = new List<Part>();
    }

    /// <summary>
    /// Part of a content (text)
    /// </summary>
    public class Part
    {
        /// <summary>
        /// Text content
        /// </summary>
        [JsonPropertyName("text")]
        public string Text { get; set; }
    }

    /// <summary>
    /// Safety setting to control response filtering
    /// </summary>
    public class SafetySetting
    {
        /// <summary>
        /// The safety category to apply the threshold to
        /// </summary>
        [JsonPropertyName("category")]
        public string Category { get; set; }

        /// <summary>
        /// The threshold level for this category
        /// </summary>
        [JsonPropertyName("threshold")]
        public string Threshold { get; set; }
    }

    /// <summary>
    /// Configuration for text generation
    /// </summary>
    public class GenerationConfig
    {
        /// <summary>
        /// Temperature controls randomness (0.0 to 1.0)
        /// </summary>
        [JsonPropertyName("temperature")]
        public float Temperature { get; set; } = 0.2f;

        /// <summary>
        /// Top-k controls diversity (1 to 40)
        /// </summary>
        [JsonPropertyName("topK")]
        public int TopK { get; set; } = 40;

        /// <summary>
        /// Top-p controls diversity (0.0 to 1.0)
        /// </summary>
        [JsonPropertyName("topP")]
        public float TopP { get; set; } = 0.95f;

        /// <summary>
        /// Maximum number of tokens in the response
        /// </summary>
        [JsonPropertyName("maxOutputTokens")]
        public int MaxOutputTokens { get; set; } = 8192;
    }


    /// <summary>
    /// A response candidate from Gemini
    /// </summary>
    public class Candidate
    {
        /// <summary>
        /// The content of the response
        /// </summary>
        [JsonPropertyName("content")]
        public ContentPart Content { get; set; }

        /// <summary>
        /// The reason for finishing generation
        /// </summary>
        [JsonPropertyName("finishReason")]
        public string FinishReason { get; set; }

        /// <summary>
        /// Safety ratings for this candidate
        /// </summary>
        [JsonPropertyName("safetyRatings")]
        public List<SafetyRating> SafetyRatings { get; set; } = new List<SafetyRating>();
    }

    /// <summary>
    /// Safety rating for a response
    /// </summary>
    public class SafetyRating
    {
        /// <summary>
        /// Safety category
        /// </summary>
        [JsonPropertyName("category")]
        public string Category { get; set; }

        /// <summary>
        /// Probability of harm in this category
        /// </summary>
        [JsonPropertyName("probability")]
        public string Probability { get; set; }
    }

    /// <summary>
    /// Usage metadata for a Gemini request/response
    /// </summary>
    public class UsageMetadata
    {
        /// <summary>
        /// Token count for the request
        /// </summary>
        [JsonPropertyName("promptTokenCount")]
        public int PromptTokenCount { get; set; }

        /// <summary>
        /// Token count for the response
        /// </summary>
        [JsonPropertyName("candidatesTokenCount")]
        public int CandidatesTokenCount { get; set; }

        /// <summary>
        /// Total token count for this interaction
        /// </summary>
        [JsonPropertyName("totalTokenCount")]
        public int TotalTokenCount { get; set; }
    }
}