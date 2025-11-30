using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("VivaplyDb");
builder.Services.AddDbContext<VivaplyDbContext>(options =>
    options.UseNpgsql(connectionString));

// Dependency Injection
builder.Services.AddScoped<ITokenService, TokenService>();

// Services Configuration
builder.Services.AddControllers();

// builder.Services.AddOpenApi();
// Classic Swagger Configuration
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Http Request Pipeline Configuration
if (app.Environment.IsDevelopment())
{
    // app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();