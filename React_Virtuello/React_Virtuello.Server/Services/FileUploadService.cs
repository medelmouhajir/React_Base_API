
using React_Virtuello.Server.DTOs.Common;
using React_Virtuello.Server.Services.Interfaces;

namespace React_Virtuello.Server.Services
{
    public class FileUploadService : IFileUploadService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileUploadService> _logger;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private readonly long _maxFileSize = 10 * 1024 * 1024; // 10MB

        public FileUploadService(IWebHostEnvironment environment, ILogger<FileUploadService> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        public async Task<FileUploadResult> UploadImageAsync(IFormFile file, string folder = "images")
        {
            try
            {
                if (!IsValidImageFile(file))
                {
                    return new FileUploadResult
                    {
                        Success = false,
                        Message = "Invalid file type or size"
                    };
                }

                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", folder);
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                var relativePath = Path.Combine("uploads", folder, uniqueFileName).Replace("\\", "/");

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                _logger.LogInformation("File uploaded successfully: {FilePath}", relativePath);

                return new FileUploadResult
                {
                    Success = true,
                    FilePath = relativePath,
                    FileName = uniqueFileName,
                    FileSize = file.Length
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file: {FileName}", file.FileName);
                return new FileUploadResult
                {
                    Success = false,
                    Message = "Error uploading file"
                };
            }
        }

        public async Task<FileUploadResult> UploadMultipleImagesAsync(IFormFileCollection files, string folder = "images")
        {
            var uploadedFiles = new List<string>();
            var errors = new List<string>();

            foreach (var file in files)
            {
                var result = await UploadImageAsync(file, folder);
                if (result.Success)
                {
                    uploadedFiles.Add(result.FilePath);
                }
                else
                {
                    errors.Add($"{file.FileName}: {result.Message}");
                }
            }

            return new FileUploadResult
            {
                Success = uploadedFiles.Any(),
                FilePath = string.Join(",", uploadedFiles),
                Message = errors.Any() ? string.Join("; ", errors) : "Files uploaded successfully"
            };
        }

        public async Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                    return true;

                var fullPath = Path.Combine(_environment.WebRootPath, filePath.TrimStart('/'));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    _logger.LogInformation("File deleted: {FilePath}", filePath);
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FilePath}", filePath);
                return false;
            }
        }

        public bool IsValidImageFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return false;

            if (file.Length > _maxFileSize)
                return false;

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return _allowedExtensions.Contains(extension);
        }
    }
}