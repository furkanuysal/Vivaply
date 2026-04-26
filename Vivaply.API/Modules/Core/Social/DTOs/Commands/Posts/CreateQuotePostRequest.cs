namespace Vivaply.API.Modules.Core.Social.DTOs.Commands.Posts
{
    public class CreateQuotePostRequest
    {
        public string? TextContent { get; set; }
        public bool IsSpoiler { get; set; }
        public string? LocationName { get; set; }
        public double? LocationLat { get; set; }
        public double? LocationLon { get; set; }
        public List<IFormFile>? Files { get; set; }
    }
}
