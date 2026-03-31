using System.Text.Json.Serialization;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.External.Tmdb
{
    public class TmdbShowDetailDto : TmdbContentDto
    {
        [JsonPropertyName("seasons")]
        public List<TmdbSeasonDto> Seasons { get; set; } = new();

        [JsonPropertyName("last_episode_to_air")]
        public TmdbEpisodeDto? LastEpisodeToAir { get; set; }

        [JsonPropertyName("next_episode_to_air")]
        public TmdbEpisodeDto? NextEpisodeToAir { get; set; }
    }
}
