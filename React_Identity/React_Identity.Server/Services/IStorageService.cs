namespace React_Identity.Server.Services
{
    public interface IStorageService
    {
        Task<string> SaveImageAsync(string base64Image, string folder, string filename);
        Task<byte[]> GetImageAsync(string imagePath);
        Task DeleteImageAsync(string imagePath);
        Task<bool> ImageExistsAsync(string imagePath);
    }
}