namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Activities
{
    public sealed record LibraryItemAddedPayload(
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl
    );

    public sealed record EpisodeWatchedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        int EpisodeNumber
    );

    public sealed record EpisodesWatchedBatchPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        List<int> EpisodeNumbers
    );

    public sealed record SeasonCompletedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        int EpisodeCount
    );

    public sealed record ShowCompletedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath
    );

    public sealed record MovieWatchedPayload(
        int TmdbMovieId,
        string Title,
        string? PosterPath
    );

    public sealed record RatingPayload(
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl,
        double Rating,
        List<string>? Developers = null,
        List<string>? Genres = null,
        List<string>? Authors = null
    );

    public sealed record ReviewPayload(
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl,
        string ReviewSnippet,
        double? Rating,
        List<string>? Developers = null,
        List<string>? Genres = null,
        List<string>? Authors = null
    );
}
