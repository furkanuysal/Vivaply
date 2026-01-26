namespace Vivaply.API.DTOs.Location
{
    public sealed class LocationResultDto
    {
        public string DisplayName { get; set; } = default!;
        public double Lat { get; set; }
        public double Lon { get; set; }
    }
}
