namespace Vivaply.API.Modules.Features.Location.DTOs
{
    public sealed class LocationResultDto
    {
        public string DisplayName { get; set; } = default!;
        public double Lat { get; set; }
        public double Lon { get; set; }
    }
}
