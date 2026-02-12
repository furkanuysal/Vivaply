using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Vivaply.API.Data;
using Vivaply.API.Services;
using Vivaply.API.Services.Account;
using Vivaply.API.Services.Dashboard;
using Vivaply.API.Services.Entertainment;
using Vivaply.API.Services.Infrastructure.RateLimiting;
using Vivaply.API.Services.Knowledge;
using Vivaply.API.Services.Location;

var builder = WebApplication.CreateBuilder(args);

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("VivaplyDb") ??
    throw new InvalidOperationException("Connection string 'VivaplyDb' is not configured.");
builder.Services.AddDbContext<VivaplyDbContext>(options =>
    options.UseNpgsql(connectionString));

// In-Memory Caching Configuration
builder.Services.AddMemoryCache();

// Rate Limiting Configuration
builder.Services.AddVivaplyRateLimiting();

// Dependency Injection
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddLocationServices();
builder.Services.AddAccountServices();
builder.Services.AddEntertainmentServices();
builder.Services.AddKnowledgeServices();

// Services Configuration
builder.Services.AddControllers();

// Health Checks Configuration
builder.Services.AddHealthChecks()
    .AddNpgSql(
        connectionString,
        name: "postgres",
        timeout: TimeSpan.FromSeconds(3));

// CORS Configuration
var allowedOrigins = builder.Configuration["AllowedOrigins"] ?? string.Empty;
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        b => b
            .WithOrigins(allowedOrigins.Split(';', StringSplitOptions.RemoveEmptyEntries)) // React URl
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()); // to allow cookies/auth headers
});

// JWT Authentication Configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Key"]!)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            ValidateLifetime = true
        };
    });

// Swagger Configuration
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Ex: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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
            new string[] {}
        }
    });
});

var app = builder.Build();

// Database Migration with Retry Logic
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<VivaplyDbContext>();

    // Retry logic to handle potential database connection issues during startup
    int retryCount = 0;
    bool connected = false;

    while (retryCount < 5 && !connected)
    {
        try
        {
            logger.LogInformation("Connecting to database and checking migrations... (Count {Retry})", retryCount + 1);
            context.Database.Migrate();
            connected = true;
            logger.LogInformation("Database updated successfully.");
        }
        catch (Exception ex)
        {
            retryCount++;
            logger.LogWarning("Database is not ready yet, retrying in 3 seconds... (Error: {Message})", ex.Message);
            Thread.Sleep(3000); // Wait for 3 seconds before retrying
            if (retryCount >= 5)
            {
                logger.LogCritical(ex, "Failed to connect to database after 5 attempts. Application is shutting down.");
                throw;
            }
        }
    }
}

// Http Request Pipeline Configuration
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

// Activate CORS Middleware
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

// Activate Rate Limiting Middleware
app.UseRateLimiter();

app.MapControllers();

// Health Check Endpoint
app.MapHealthChecks("/health", new HealthCheckOptions
{
    AllowCachingResponses = false
}).AllowAnonymous();

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Name == "postgres",
    AllowCachingResponses = false
}).AllowAnonymous();

app.Run();