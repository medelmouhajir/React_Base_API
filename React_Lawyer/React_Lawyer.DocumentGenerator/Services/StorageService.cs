namespace React_Lawyer.DocumentGenerator.Services
{
    public class StorageService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<StorageService> _logger;
        private readonly string _basePath;
        private readonly string _baseUrl;

        public StorageService(
            IConfiguration configuration,
            ILogger<StorageService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            // Load configuration
            _basePath = _configuration["Storage:BasePath"] ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Documents");
            _baseUrl = _configuration["Storage:BaseUrl"] ?? "/api/documents";

            // Ensure the base path exists
            Directory.CreateDirectory(_basePath);
        }

        /// <summary>
        /// Store a document file
        /// </summary>
        /// <param name="documentBytes">Document content as bytes</param>
        /// <param name="documentId">ID of the document</param>
        /// <param name="extension">File extension</param>
        /// <returns>Storage path</returns>
        public async Task<string> StoreDocumentAsync(byte[] documentBytes, string documentId, string extension)
        {
            if (documentBytes == null || documentBytes.Length == 0)
            {
                throw new ArgumentException("Document content cannot be empty");
            }

            // Create a storage path based on document ID and current date
            var datePath = DateTime.UtcNow.ToString("yyyy/MM/dd");
            var directory = Path.Combine(_basePath, datePath);
            Directory.CreateDirectory(directory);

            // Define filename with extension
            var filename = $"{documentId}.{extension}";
            var filePath = Path.Combine(directory, filename);

            // Save the file
            try
            {
                _logger.LogInformation("Storing document {DocumentId} at path: {FilePath}", documentId, filePath);

                await File.WriteAllBytesAsync(filePath, documentBytes);

                // Return the relative storage path
                return Path.Combine(datePath, filename).Replace("\\", "/");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing document {DocumentId}", documentId);
                throw new IOException($"Failed to store document: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Retrieve a document file
        /// </summary>
        /// <param name="storagePath">Storage path of the document</param>
        /// <returns>Document content as bytes</returns>
        public async Task<byte[]> GetDocumentAsync(string storagePath)
        {
            var filePath = Path.Combine(_basePath, storagePath);

            try
            {
                _logger.LogInformation("Retrieving document from path: {FilePath}", filePath);

                if (!File.Exists(filePath))
                {
                    _logger.LogWarning("Document file not found: {FilePath}", filePath);
                    throw new FileNotFoundException($"Document file not found: {filePath}");
                }

                return await File.ReadAllBytesAsync(filePath);
            }
            catch (Exception ex) when (ex is not FileNotFoundException)
            {
                _logger.LogError(ex, "Error retrieving document from path: {FilePath}", filePath);
                throw new IOException($"Failed to retrieve document: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Delete a document file
        /// </summary>
        /// <param name="storagePath">Storage path of the document</param>
        /// <returns>True if deletion was successful</returns>
        public bool DeleteDocument(string storagePath)
        {
            var filePath = Path.Combine(_basePath, storagePath);

            try
            {
                _logger.LogInformation("Deleting document from path: {FilePath}", filePath);

                if (!File.Exists(filePath))
                {
                    _logger.LogWarning("Document file to delete not found: {FilePath}", filePath);
                    return false;
                }

                File.Delete(filePath);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document from path: {FilePath}", filePath);
                return false;
            }
        }

        /// <summary>
        /// Get the URL for a document
        /// </summary>
        /// <param name="storagePath">Storage path of the document</param>
        /// <returns>URL to access the document</returns>
        public string GetDocumentUrl(string storagePath)
        {
            return $"{_baseUrl}/{storagePath}";
        }
    }
}
