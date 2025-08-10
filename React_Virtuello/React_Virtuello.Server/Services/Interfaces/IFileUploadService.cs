using React_Virtuello.Server.DTOs.Common;

namespace React_Virtuello.Server.Services.Interfaces
{
    public interface IFileUploadService
    {
        Task<FileUploadResult> UploadImageAsync(IFormFile file, string folder = "images");
        Task<bool> DeleteFileAsync(string filePath);
        Task<FileUploadResult> UploadMultipleImagesAsync(IFormFileCollection files, string folder = "images");
        bool IsValidImageFile(IFormFile file);
    }
}