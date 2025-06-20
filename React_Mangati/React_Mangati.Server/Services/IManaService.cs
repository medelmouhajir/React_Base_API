using React_Mangati.Server.Studio.Tokens.Transactions;

namespace React_Mangati.Server.Services
{
    public interface IManaService
    {
        Task<decimal> GetBalanceAsync(string userId);
        Task<bool> DeductManaAsync(string userId, decimal amount, string reason, string relatedEntityId);
        Task<ManaTransaction> AddManaAsync(string userId, decimal amount, Transaction_Type type, string reason);
        Task<bool> HasSufficientManaAsync(string userId, decimal requiredAmount);
    }
}
