namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Activities
{
    public sealed record LibraryItemAddedPayload(
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl,
        List<string>? Developers = null,
        List<string>? Genres = null,
        List<string>? Authors = null
    );

    public sealed record EpisodeWatchedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        int EpisodeNumber,
        List<string>? Genres = null
    );

    public sealed record EpisodesWatchedBatchPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        List<int> EpisodeNumbers,
        List<string>? Genres = null
    );

    public sealed record SeasonCompletedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        int EpisodeCount,
        List<string>? Genres = null
    );

    public sealed record ShowCompletedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        List<string>? Genres = null
    );

    public sealed record MovieWatchedPayload(
        int TmdbMovieId,
        string Title,
        string? PosterPath,
        List<string>? Genres = null
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
