using System.Text.Json;

namespace Vivaply.API.Services.Infrastructure.Serialization
{
    public static class JsonHelper
    {
        private static readonly JsonSerializerOptions Options = new()
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = false
        };

        // Generic serialize
        public static string? Serialize<T>(T? value)
        {
            if (value == null)
                return null;

            return JsonSerializer.Serialize(value, Options);
        }

        // Generic deserialize
        public static T? Deserialize<T>(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return default;

            return JsonSerializer.Deserialize<T>(json, Options);
        }

        // Safe list deserialize (Return empty list instead of null)
        public static List<T> DeserializeList<T>(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<T>();

            return JsonSerializer.Deserialize<List<T>>(json, Options) ?? new List<T>();
        }

        // List serialize (Return null instead of empty list)
        public static string? SerializeList<T>(List<T>? value)
        {
            if (value == null || value.Count == 0)
                return null;

            return JsonSerializer.Serialize(value, Options);
        }
    }
}