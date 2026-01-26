using Vivaply.API.DTOs.Location;

namespace Vivaply.API.Services.Location
{

    public interface INominatimService
    {
        Task<IReadOnlyList<LocationResultDto>> SearchAsync(
            string query,
            CancellationToken ct = default
        );
    }
}
