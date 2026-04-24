using Microsoft.AspNetCore.Mvc;

namespace Vivaply.API.Modules.Core.Search.DTOs.Queries
{
    public class SearchQuery
    {
        [FromQuery(Name = "q")]
        public string? Query { get; set; }

        public int Take { get; set; } = 8;
    }
}
