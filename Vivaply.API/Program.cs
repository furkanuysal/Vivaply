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