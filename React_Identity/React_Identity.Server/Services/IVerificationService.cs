using React_Identity.Server.DTOs;

namespace React_Identity.Server.Services
{
    public interface IVerificationService
    {
        Task QueueSelfieVerificationAsync(Guid requestId);
        Task QueueDocumentVerificationAsync(Guid requestId);
        Task QueueCombinedVerificationAsync(Guid requestId);
        Task ProcessSelfieVerificationAsync(Guid requestId);
        Task ProcessDocumentVerificationAsync(Guid requestId);
        Task ProcessCombinedVerificationAsync(Guid requestId);
        Task SendCallbackAsync(Guid requestId, CallbackPayloadDto payload);
    }
}