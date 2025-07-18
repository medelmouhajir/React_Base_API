using React_Identity.Server.Models;

namespace React_Identity.Server.Services
{
    public interface IAuthService
    {
        (byte[] hash, byte[] salt) HashPassword(string password);
        bool VerifyPassword(string password, byte[] hash, byte[] salt);
        string GenerateApiKey();
        string GenerateJwtToken(Account account);
        bool ValidateApiKey(string apiKey);
        Task<Account?> GetAccountFromApiKeyAsync(string apiKey);
    }
}