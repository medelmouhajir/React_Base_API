using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Rentify_GPS_Service_Worker.Data;
using Rentify_GPS_Service_Worker.Protocols.Teltonika.Commands;
using Rentify_GPS_Service_Worker.Services;

namespace Rentify_GPS_Service_Worker
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = Host.CreateApplicationBuilder(args);

            // 1. Register MainDbContext for PostgreSQL
            builder.Services.AddDbContext<MainDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


            // ✅ NEW: Register Memory Cache for speed limit caching
            builder.Services.AddMemoryCache();

            // ✅ NEW: Or if you prefer to register it as scoped
            builder.Services.AddScoped<ISpeedLimitService, OpenStreetMapSpeedLimitService>();


            // 2. Register Worker as a hosted service
            //builder.Services.AddHostedService<Worker>();

            // 3. Register command processing (if you're using it)
            builder.Services.AddCommandProcessing();

            var host = builder.Build();
            host.Run();
        }
    }

    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddCommandProcessing(this IServiceCollection services)
        {
            services.AddSingleton<TeltonikaCommandSender>();

            // For database approach
            services.AddHostedService<CommandQueueProcessor>();

            return services;
        }
    }
}
