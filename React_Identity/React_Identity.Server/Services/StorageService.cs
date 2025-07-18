
using System.Text.RegularExpressions;

namespace React_Identity.Server.Services
{
    public class StorageService : IStorageService
    {
        private readonly string _basePath;
        private readonly ILogger<StorageService> _logger;

        public StorageService(IConfiguration configuration, ILogger<StorageService> logger)
        {
            _basePath = configuration["Storage:LocalPath"] ?? "uploads";
            _logger = logger;

            // Ensure base directory exists
            if (!Directory.Exists(_basePath))
            {
                Directory.CreateDirectory(_basePath);
                _logger.LogInformation("Created storage directory: {BasePath}", _basePath);
            }
        }

        public async Task<string> SaveImageAsync(string base64Image, string folder, string filename)
        {
            try
            {
                // Remove data URL prefix if present (data:image/jpeg;base64,)
                var base64Data = Regex.Replace(base64Image, @"^data:image\/[a-zA-Z]+;base64,", "");

                // Convert base64 to bytes
                var imageBytes = Convert.FromBase64String(base64Data);

                // Create folder path
                var folderPath = Path.Combine(_basePath, folder);
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                // Create full file path
                var filePath = Path.Combine(folderPath, filename);

                // Save file
                await File.WriteAllBytesAsync(filePath, imageBytes);

                // Return relative path
                var relativePath = Path.Combine(folder, filename).Replace('\\', '/');

                _logger.LogInformation("Image saved successfully: {RelativePath}", relativePath);
                return relativePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image to folder: {Folder}, filename: {Filename}", folder, filename);
                throw;
            }
        }

        public async Task<byte[]> GetImageAsync(string imagePath)
        {
            try
            {
                var fullPath = Path.Combine(_basePath, imagePath);

                if (!File.Exists(fullPath))
                {
                    throw new FileNotFoundException($"Image not found: {imagePath}");
                }

                return await File.ReadAllBytesAsync(fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving image: {ImagePath}", imagePath);
                throw;
            }
        }

        public async Task DeleteImageAsync(string imagePath)
        {
            try
            {
                var fullPath = Path.Combine(_basePath, imagePath);

                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    _logger.LogInformation("Image deleted: {ImagePath}", imagePath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image: {ImagePath}", imagePath);
                throw;
            }
        }

        public async Task<bool> ImageExistsAsync(string imagePath)
        {
            try
            {
                var fullPath = Path.Combine(_basePath, imagePath);
                return File.Exists(fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if image exists: {ImagePath}", imagePath);
                return false;
            }
        }
    }
}