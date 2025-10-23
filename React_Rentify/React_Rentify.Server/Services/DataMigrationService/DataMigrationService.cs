using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.Services.DataEncryption;

namespace React_Rentify.Server.Services.DataMigrationService
{
    public class DataMigrationService
    {
        private readonly MainDbContext _context;
        private readonly IDataEncryptionService _encryption;

        public DataMigrationService(MainDbContext context, IDataEncryptionService encryption)
        {
            _context = context;
            _encryption = encryption;
        }

        public async Task EncryptExistingDataAsync()
        {
            // Disable auto-encryption temporarily
            var users = await _context.Customers.ToListAsync();

            foreach (var user in users)
            {
                // Only encrypt if not already encrypted
                if (!string.IsNullOrEmpty(user.PassportId) && !user.PassportId.StartsWith("CfDJ8")) // Data Protection prefix
                {
                    user.PassportId = _encryption.Encrypt(user.PassportId);
                }
                if (!string.IsNullOrEmpty(user.NationalId) && !user.NationalId.StartsWith("CfDJ8")) // Data Protection prefix
                {
                    user.NationalId = _encryption.Encrypt(user.NationalId);
                }
                if (!string.IsNullOrEmpty(user.LicenseNumber) && !user.LicenseNumber.StartsWith("CfDJ8")) // Data Protection prefix
                {
                    user.LicenseNumber = _encryption.Encrypt(user.LicenseNumber);
                }

            }

            await _context.SaveChangesAsync();
            Console.WriteLine($"Encrypted {users.Count} records");
        }
    }
}
