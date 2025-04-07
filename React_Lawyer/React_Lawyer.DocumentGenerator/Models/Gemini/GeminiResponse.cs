using DocumentGeneratorAPI.Models.Gemini;
using System.Text.Json.Serialization;

namespace React_Lawyer.DocumentGenerator.Models.Gemini
{
    /// <summary>
    /// Response from Gemini API
    /// </summary>
    public class GeminiResponse
    {
        /// <summary>
        /// Response candidates (typically just one)
        /// </summary>
        [JsonPropertyName("candidates")]
        public List<Candidate> Candidates { get; set; } = new List<Candidate>();

        /// <summary>
        /// Usage metrics for the request
        /// </summary>
        [JsonPropertyName("usageMetadata")]
        public UsageMetadata UsageMetadata { get; set; }
    }
}
