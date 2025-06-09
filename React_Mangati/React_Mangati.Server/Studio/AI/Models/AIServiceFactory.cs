using System;
using Microsoft.Extensions.DependencyInjection;

namespace React_Mangati.Server.Studio.AI.Models
{
    public enum AIProvider
    {
        Gemini,
        ChatGPT,
        Sora
    }

    public interface IAIServiceFactory
    {
        IAIService GetService(AIProvider provider);
    }

    public class AIServiceFactory : IAIServiceFactory
    {
        private readonly IServiceProvider _serviceProvider;

        public AIServiceFactory(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public IAIService GetService(AIProvider provider)
        {
            return provider switch
            {
                AIProvider.Gemini => _serviceProvider.GetRequiredService<GeminiService>(),
                AIProvider.ChatGPT => _serviceProvider.GetRequiredService<ChatGPTService>(),
                AIProvider.Sora => _serviceProvider.GetRequiredService<SoraService>(),
                _ => throw new NotSupportedException($"AI provider {provider} is not supported")
            };
        }
    }
}