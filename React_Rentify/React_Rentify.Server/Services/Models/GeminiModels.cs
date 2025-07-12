namespace React_Rentify.Server.Services.Models
{
    public class IdentityExtractRequest
    {
        public List<ImagePart> Images { get; set; }
        public string Prompt { get; set; }
    }

    public class ImagePart
    {
        public string Base64 { get; set; }
    }

    public class IdentityExtractResponse
    {
        public List<Candidate> Candidates { get; set; }
        public UsageMetadata UsageMetadata { get; set; }
    }

    public class Candidate
    {
        public Content Content { get; set; }
    }

    public class Content
    {
        public List<Part> Parts { get; set; }
    }

    public class Part
    {
        public string Text { get; set; }
    }

    public class UsageMetadata
    {
        public int PromptTokenCount { get; set; }
        public int CandidatesTokenCount { get; set; }
    }
}
