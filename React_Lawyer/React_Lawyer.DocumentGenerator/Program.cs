using Microsoft.EntityFrameworkCore;
using React_Lawyer.DocumentGenerator.Data;
using React_Lawyer.DocumentGenerator.Data.Context;
using React_Lawyer.DocumentGenerator.Services;

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
            builder.Services.AddScoped<ITrainingDataRepository, TrainingDataRepository>();
            builder.Services.AddScoped<IGenerationJobRepository, GenerationJobRepository>();

            // Register services
            builder.Services.AddScoped<TemplateService>();
            builder.Services.AddScoped<GeminiService>();
            builder.Services.AddScoped<StorageService>();
            builder.Services.AddScoped<ClientService>();
            builder.Services.AddScoped<DocumentGenerationService>();
            builder.Services.AddScoped<TrainingService>();

            // Register HttpClient
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