using Microsoft.AspNetCore.DataProtection;



namespace React_Rentify.Server.Services.DataEncryption
{
    public interface IDataEncryptionService
    {
        string Encrypt(string plaintext);
        string Decrypt(string ciphertext);
    }

    public class DataEncryptionService : IDataEncryptionService
    {
        private readonly IDataProtector _protector;

        public DataEncryptionService(IDataProtectionProvider provider)
        {
            _protector = provider.CreateProtector("WanSolutions.DataProtection");
        }

        public string Encrypt(string plaintext)
        {
            return string.IsNullOrEmpty(plaintext) ? plaintext : _protector.Protect(plaintext);
        }

        public string Decrypt(string ciphertext)
        {
            if (string.IsNullOrEmpty(ciphertext)) return ciphertext;
            try { return _protector.Unprotect(ciphertext); }
            catch { return ciphertext; } // Data not encrypted yet
        }
    }
}
