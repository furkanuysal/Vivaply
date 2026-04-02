using Microsoft.EntityFrameworkCore;
using Vivaply.API.Entities.Entertainment;
using Vivaply.API.Entities.Entertainment.Igdb;
using Vivaply.API.Entities.Entertainment.Tmdb;
using Vivaply.API.Entities.Finance;
using Vivaply.API.Entities.Gamification;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Entities.Knowledge;

namespace Vivaply.API.Data
{
    public class VivaplyDbContext(DbContextOptions<VivaplyDbContext> options) : DbContext(options)
    {

        // General Tables (Entities)
        public DbSet<User> Users { get; set; }
        public DbSet<UserPreferences> UserPreferences { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<UserRefreshToken> UserRefreshTokens { get; set; }
        public DbSet<UserFollow> UserFollows { get; set; }
        public DbSet<UserActivity> UserActivities { get; set; }

        // Entertainment Tables
        public DbSet<UserShow> UserShows { get; set; }
        public DbSet<UserMovie> UserMovies { get; set; }
        public DbSet<WatchedEpisode> WatchedEpisodes { get; set; }
        public DbSet<UserGame> UserGames { get; set; }

        // Entertainment Metadata Tables
        public DbSet<ShowMetadata> ShowMetadata { get; set; }
        public DbSet<MovieMetadata> MovieMetadata { get; set; }
        public DbSet<GameMetadata> GameMetadata { get; set; }

        // Knowledge Tables
        public DbSet<UserBook> UserBooks { get; set; }

        // Knowledge Metadata Tables
        public DbSet<BookMetadata> BookMetadata { get; set; }

        // Relationship Configurations
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(VivaplyDbContext).Assembly);
        }
    }
}
