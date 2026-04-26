namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Posts
{
    public class PostLocationDto
    {
        public string DisplayName { get; set; } = string.Empty;
        public double? Lat { get; set; }
        public double? Lon { get; set; }
    }
}
