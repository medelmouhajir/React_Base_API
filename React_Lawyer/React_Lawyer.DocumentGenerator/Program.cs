using DocumentGeneratorAPI.Data;
using DocumentGeneratorAPI.Data.Repositories;
using DocumentGeneratorAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace React_Lawyer.DocumentGenerator
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Configure database
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


            // Register repositories
            builder.Services.AddScoped<ITemplateRepository, TemplateRepository>();
            builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();

            // Register services
            builder.Services.AddScoped<TemplateService>();
            builder.Services.AddScoped<DocumentService>();
            builder.Services.AddScoped<GeminiService>();
            builder.Services.AddScoped<StorageService>();
            builder.Services.AddScoped<EnhancedGeminiService>();

            // Register HttpClient for API calls
            builder.Services.AddHttpClient();



            // Configure CORS
            var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ??
                new[] { "http://localhost:5267", "http://localhost:54440" };

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            var app = builder.Build();

            // Apply pending migrations
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    context.Database.Migrate(); // This applies pending migrations
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while migrating the database.");
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Don't redirect to HTTPS in development if configured
            if (!app.Environment.IsDevelopment() || !builder.Configuration.GetValue<bool>("DisableHttpsRedirection", false))
            {
                app.UseHttpsRedirection();
            }

            app.UseCors();
            app.UseAuthorization();
            app.MapControllers();

            app.Run();
        }
    }
}