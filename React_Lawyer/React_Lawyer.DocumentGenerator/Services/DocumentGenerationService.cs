using React_Lawyer.DocumentGenerator.Data;
using React_Lawyer.DocumentGenerator.Models;
using React_Lawyer.DocumentGenerator.Models.Templates.Gemini;

namespace React_Lawyer.DocumentGenerator.Services
{

    public class DocumentGenerationService
    {
        private readonly GeminiService _geminiService;
        private readonly TemplateService _templateService;
        private readonly StorageService _storageService;
        private readonly IDocumentRepository _documentRepository;
        private readonly IGenerationJobRepository _jobRepository;
        private readonly ILogger<DocumentGenerationService> _logger;

        public DocumentGenerationService(
            GeminiService geminiService,
            TemplateService templateService,
            StorageService storageService,
            IDocumentRepository documentRepository,
            IGenerationJobRepository jobRepository,
            ILogger<DocumentGenerationService> logger)
        {
            _geminiService = geminiService;
            _templateService = templateService;
            _storageService = storageService;
            _documentRepository = documentRepository;
            _jobRepository = jobRepository;
            _logger = logger;
        }


    }
}
