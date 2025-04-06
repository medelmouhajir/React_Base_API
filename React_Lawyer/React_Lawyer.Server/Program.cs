// React_Lawyer/React_Lawyer.Server/Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using React_Lawyer.Server.Data;
using React_Lawyer.Server.Services;
using System.Text;

namespace React_Lawyer.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers();

            // Add database context
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Configure JWT authentication
            ConfigureJwtAuthentication(builder);

            // Configure CORS
            ConfigureCors(builder);


            builder.Services.AddHttpClient<DocumentGenerationClient>(client =>
            {
                // Configure base URL from appsettings.json
                var docGenUrl = builder.Configuration["Services:DocumentGenerator:Url"] ?? "http://localhost:5268";
                client.BaseAddress = new Uri(docGenUrl);
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            });

            builder.Services.AddScoped<DocumentGenerationClient>();


            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

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


            app.UseDefaultFiles();
            app.UseStaticFiles();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // Use CORS before auth
            app.UseCors("AllowReactApp");

            // Enable authentication and authorization
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.MapFallbackToFile("/index.html");

            app.Run();
        }

        private static void ConfigureJwtAuthentication(WebApplicationBuilder builder)
        {
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ??
                "DefaultSecretKeyThatShouldBeReplaced123456789012345678901234"; // Use a secure key in production

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // Only require HTTPS in production
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey)),
                    ValidateIssuer = false, // Set to true in production and specify issuer
                    ValidateAudience = false, // Set to true in production and specify audience
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero // Remove default 5-minute tolerance for token expiration
                };

                // For signalR support (if needed later)
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });
        }

        private static void ConfigureCors(WebApplicationBuilder builder)
        {
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", builder =>
                {
                    builder.WithOrigins(
                            // Development origins
                            "http://localhost:54440",
                            "https://localhost:54440",
                            // Production origin (update with your domain)
                            "https://yourdomain.com"
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials(); // Important for cookies
                });
            });
        }
    }
}