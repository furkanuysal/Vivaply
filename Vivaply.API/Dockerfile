# =========================
# Build stage (.NET 10 SDK)
# =========================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Vivaply.API.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish

# =========================
# Runtime stage (.NET 10 ASP.NET)
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

# Install curl (required for Docker healthchecks)
RUN apt-get update \
    && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Vivaply.API.dll"]