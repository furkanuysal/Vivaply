using Vivaply.API.Modules.Features.Location.DTOs;

namespace Vivaply.API.Modules.Features.Location.Services.Interfaces
{

    public interface INominatimService
    {
        Task<IReadOnlyList<LocationResultDto>> SearchAsync(
            string query,
            CancellationToken ct = default
        );
    }
}
