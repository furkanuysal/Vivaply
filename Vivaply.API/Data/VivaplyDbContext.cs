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
    public class VivaplyDbContext : DbContext
    {
        // Constructor
        public VivaplyDbContext(DbContextOptions<VivaplyDbContext> options) : base(options)
        {
        }

        // General Tables (Entities)
        public DbSet<User> Users { get; set; }
        public DbSet<UserPreferences> UserPreferences { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<UserRefreshToken> UserRefreshTokens { get; set; }

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

            // User -> UserProfile Relationship (1-to-1)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Profile)         // One User has one Profile
                .WithOne(p => p.User)             // One Profile belongs to one User
                .HasForeignKey<UserProfile>(p => p.UserId) // Profile's foreign key is UserId
                .OnDelete(DeleteBehavior.Cascade); // If user is deleted, delete profile

            // User -> UserPreferences Relationship (1-to-1)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Preferences)
                .WithOne(p => p.User)
                .HasForeignKey<UserPreferences>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> UserRefreshTokens Relationship (1-to-Many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.RefreshTokens)
                .WithOne(t => t.User)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> Wallet Relationship (1-to-1)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Wallet)
                .WithOne(w => w.User)
                .HasForeignKey<Wallet>(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Entertainment Relationships

            // Show - Episodes Relationships (1-to-Many)
            modelBuilder.Entity<UserShow>()
                .HasMany(s => s.WatchedEpisodes) // One show has many watched episodes
                .WithOne(e => e.UserShow)        // One watched episode belongs to one show
                .HasForeignKey(e => e.UserShowId)
                .OnDelete(DeleteBehavior.Cascade); // Delete episodes if show is deleted

            // Movie - User Relationships (1-to-Many)
            modelBuilder.Entity<UserMovie>()
                .HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Game - User Relationships (1-to-Many)
            modelBuilder.Entity<UserGame>()
                .HasOne(g => g.User)
                .WithMany()
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Metadata Keys
            modelBuilder.Entity<ShowMetadata>()
                .HasKey(x => x.TmdbShowId);

            modelBuilder.Entity<MovieMetadata>()
                .HasKey(x => x.TmdbMovieId);

            modelBuilder.Entity<GameMetadata>()
                .HasKey(x => x.IgdbId);

            // UserShow -> ShowMetadata (Many-to-One)
            modelBuilder.Entity<UserShow>()
                .HasOne(s => s.Metadata)
                .WithMany()
                .HasForeignKey(s => s.TmdbShowId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserMovie>()
                .HasOne(m => m.Metadata)
                .WithMany()
                .HasForeignKey(m => m.TmdbMovieId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserGame>()
                .HasOne(g => g.Metadata)
                .WithMany()
                .HasForeignKey(g => g.IgdbId)
                .OnDelete(DeleteBehavior.Restrict);

            // Knowledge Relationships
            // User - UserBook Relationships (1-to-Many)
            modelBuilder.Entity<UserBook>()
                .HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BookMetadata>()
                 .HasKey(x => x.GoogleBookId);

            modelBuilder.Entity<UserBook>()
                 .HasOne(b => b.Metadata)
                 .WithMany()
                 .HasForeignKey(b => b.GoogleBookId)
                 .OnDelete(DeleteBehavior.Restrict);

            // Unique Constraints to prevent duplicate entries for the same user and item

            modelBuilder.Entity<UserShow>()
                .HasIndex(x => new { x.UserId, x.TmdbShowId })
                .IsUnique();

            modelBuilder.Entity<UserMovie>()
                .HasIndex(x => new { x.UserId, x.TmdbMovieId })
                .IsUnique();

            modelBuilder.Entity<UserGame>()
                .HasIndex(x => new { x.UserId, x.IgdbId })
                .IsUnique();

            modelBuilder.Entity<UserBook>()
                .HasIndex(x => new { x.UserId, x.GoogleBookId })
                .IsUnique();
        }
    }
}
