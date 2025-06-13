using System.Collections.Generic;
using System.Threading.Tasks;

namespace React_Mangati.Server.Studio.AI.Models
{
    public interface IAIService
    {
        /// <summary>
        /// Generate an image from text prompt
        /// </summary>
        /// <param name="prompt">Text description for image generation</param>
        /// <param name="options">Optional generation parameters</param>
        /// <returns>Generated image URL or base64 string</returns>
        Task<AIImageResponse> GenerateImageFromTextAsync(string prompt, AIImageOptions options = null);

        /// <summary>
        /// Generate an image from text prompt and reference images
        /// </summary>
        /// <param name="prompt">Text description for image generation</param>
        /// <param name="images">Reference images (URLs or base64)</param>
        /// <param name="options">Optional generation parameters</param>
        /// <returns>Generated image URL or base64 string</returns>
        Task<AIImageResponse> GenerateImageFromTextAndImagesAsync(string prompt, List<string> images, AIImageOptions options = null);
    }

    public class AIImageResponse
    {
        public bool Success { get; set; }
        public string ImageUrl { get; set; }
        public string Base64Image { get; set; }
        public string Error { get; set; }
        public Dictionary<string, object> Metadata { get; set; }
        public string GeneratedText { get; set; } // Add this for Gemini text responses
    }

    public class AIImageOptions
    {
        public int Width { get; set; } = 1024;
        public int Height { get; set; } = 1024;
        public string Style { get; set; }
        public string Quality { get; set; } = "standard";
        public int Count { get; set; } = 1;
        public string Model { get; set; }

        // Gemini-specific options
        public double Temperature { get; set; } = 0.4;
        public int TopK { get; set; } = 32;
        public double TopP { get; set; } = 1;
        public int MaxTokens { get; set; } = 2048;
    }
}