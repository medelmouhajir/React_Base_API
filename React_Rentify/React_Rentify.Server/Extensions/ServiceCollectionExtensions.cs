using Microsoft.Extensions.DependencyInjection;
using React_Rentify.Server.Services;

namespace React_Rentify.Server.Extensions
{
    /// <summary>
    /// Extension methods for service registration
    /// </summary>
    public static class ServiceCollectionExtensions
    {
        /// <summary>
        /// Registers maintenance-related services
        /// </summary>
        public static IServiceCollection AddMaintenanceServices(this IServiceCollection services)
        {
            // Register the manual maintenance scheduling service
            services.AddScoped<IMaintenanceSchedulingService, ManualMaintenanceSchedulingService>();

            // Register the background maintenance scheduling service
            services.AddHostedService<MaintenanceSchedulingService>();

            return services;
        }

        /// <summary>
        /// Registers all custom services for the Rentify application
        /// </summary>
        public static IServiceCollection AddRentifyServices(this IServiceCollection services)
        {
            // Add maintenance services
            services.AddMaintenanceServices();

            // Add other services here as they are created
            // services.AddNotificationServices();
            // services.AddReportingServices();
            // etc.

            return services;
        }
    }
}