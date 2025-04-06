using React_Lawyer.DocumentGenerator.Models;

namespace React_Lawyer.DocumentGenerator.Infrastructure.GeminiClient
{
    public class DocumentGenerationClient
    {
        private readonly HttpClient _httpClient;

        public DocumentGenerationClient(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient("DocumentGenerator");
        }

        public async Task<GenerationResponse> GenerateDocumentAsync(GenerationRequest request)
        {
            var response = await _httpClient.PostAsJsonAsync("/api/documents/generate", request);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<GenerationResponse>();
        }
    }
}
