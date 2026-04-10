namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Posts
{
    public class PostDeletionDto
    {
        public Guid Id { get; set; }
        public Guid? ParentPostId { get; set; }
        public int? ParentReplyCount { get; set; }
        public Guid? QuotedPostId { get; set; }
        public int? QuotedPostQuoteCount { get; set; }
    }
}
