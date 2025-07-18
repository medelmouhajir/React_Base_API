using React_Identity.Server.DTOs;

namespace React_Identity.Server.Services
{
    public interface ICallbackService
    {
        Task SendCallbackAsync(Guid requestId, CallbackPayloadDto payload);
        Task RetryFailedCallbacksAsync();
    }
}