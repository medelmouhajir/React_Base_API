namespace React_Mangati.Server.Services
{
    public class ImageGenerationCostService
    {
        private readonly IConfiguration _configuration;

        // Base rates (you'll need to update these based on actual OpenAI pricing)
        private const decimal CHATGPT_TOKEN_PRICE = 0.000002m; // $0.002 per 1K tokens
        private const decimal PRICE_MULTIPLIER = 2.5m;

        public decimal CalculateManaCost(ImageGenerationRequest request)
        {
            // Estimate tokens based on prompt complexity
            int estimatedTokens = EstimateTokenCount(request.Prompt);

            // Add base cost for image generation
            int baseImageTokens = request.Quality switch
            {
                "standard" => 1000,
                "hd" => 2000,
                _ => 1000
            };

            int totalTokens = estimatedTokens + baseImageTokens;
            decimal manaCost = totalTokens * CHATGPT_TOKEN_PRICE * PRICE_MULTIPLIER;

            return Math.Ceiling(manaCost * 100) / 100; // Round up to 2 decimals
        }

        private int EstimateTokenCount(string text)
        {
            // Rough estimation: 1 token ≈ 4 characters
            return (int)Math.Ceiling(text.Length / 4.0);
        }
    }

    public class ImageGenerationRequest
    {
        public string Prompt { get; set; }
        public string Quality { get; set; }

    }
}
