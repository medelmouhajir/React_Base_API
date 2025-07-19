using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using React_Identity.Server.Data;
using React_Identity.Server.Services;
using System.Text;

namespace React_Identity.Server
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();

            // Configure Swagger with JWT support
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "WAN Solutions Identity Verification API",
                    Version = "v1",
                    Description = "Secure identity verification service for document and selfie validation",
                    Contact = new OpenApiContact
                    {
                        Name = "WAN Solutions",
                        Email = "admin@wan-solutions.ma"
                    }
                });

                // Add JWT authentication to Swagger
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                options.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
                {
                    Description = "API Key authentication. Example: \"wan_your_api_key_here\"",
                    Name = "X-Api-Key",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    },
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "ApiKey"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            // Configure Database
            builder.Services.AddDbContext<IdentityDbContext>(options =>
                options.UseNpgsql(
                    builder.Configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly("React_Identity.Server")
                )
            );

            // Configure JWT Authentication
            ConfigureJwtAuthentication(builder);

            // Configure CORS
            ConfigureCors(builder);

            // Register application services
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IVerificationService, VerificationService>();
            builder.Services.AddScoped<IStorageService, StorageService>();
            builder.Services.AddSingleton<IMessageQueueService, RabbitMQService>();
            builder.Services.AddScoped<IAIService, MockAIService>(); // Replace with real implementation
            builder.Services.AddScoped<ICallbackService, CallbackService>();

            // Add HttpClient for external API calls
            builder.Services.AddHttpClient();

            // Add background services
            builder.Services.AddHostedService<VerificationWorkerService>();

            // Add health checks with proper NuGet packages
            builder.Services.AddHealthChecks()
                .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
                .AddRabbitMQ(rabbitConnectionString: builder.Configuration.GetConnectionString("RabbitMQ") ??
                    "amqp://admin:admin123@localhost:5672/");

            var app = builder.Build();

            // Apply pending migrations and seed data
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<IdentityDbContext>();
                    await context.Database.MigrateAsync();

                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogInformation("Database migrations applied successfully");
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while migrating the database");
                }
            }

            // Configure the HTTP request pipeline
            app.UseDefaultFiles();
            app.UseStaticFiles();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Identity Verification API v1");
                    c.RoutePrefix = "swagger";
                    c.DocumentTitle = "WAN Solutions Identity Verification API";
                });
            }

            // Security headers
            app.Use(async (context, next) =>
            {
                context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
                context.Response.Headers.Add("X-Frame-Options", "DENY");
                context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
                context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
                await next();
            });

            // Enable CORS
            app.UseCors("AllowIdentityClients");

            // Authentication & Authorization
            app.UseAuthentication();
            app.UseAuthorization();

            // API Key middleware
            app.UseMiddleware<ApiKeyMiddleware>();

            // Health checks
            app.MapHealthChecks("/health");

            // Controllers
            app.MapControllers();

            // Fallback for SPA
            app.MapFallbackToFile("/index.html");

            app.Run();
        }

        private static void ConfigureJwtAuthentication(WebApplicationBuilder builder)
        {
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ??
                "DefaultSecretKeyThatShouldBeReplaced123456789012345678901234"; // Fallback for development

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings["Issuer"] ?? "identity-api",
                    ValidateAudience = true,
                    ValidAudience = jwtSettings["Audience"] ?? "identity-clients",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });

            // Add authorization policies
            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("RequireApiKey", policy =>
                    policy.RequireClaim("api_key"));
            });
        }

        private static void ConfigureCors(WebApplicationBuilder builder)
        {
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowIdentityClients", corsBuilder =>
                {
                    corsBuilder.WithOrigins(
                            // Development origins
                            "http://localhost:51240",
                            "https://localhost:51240",
                            "http://localhost:5080",
                            "https://localhost:7188",
                            // Production origins - add your domains
                            "https://identity.wan-solutions.ma",
                            "https://www.identity.wan-solutions.ma"
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials()
                        .SetPreflightMaxAge(TimeSpan.FromSeconds(3600));
                });
            });
        }
    }
}