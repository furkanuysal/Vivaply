import { useState } from "react";
import AuthModal from "@/features/auth/components/AuthModal";
import landingHero from "@/assets/landing-hero.png";
import {
  BookOpenIcon,
  FilmIcon,
  SparklesIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-skin-base text-skin-text font-sans selection:bg-skin-primary/30">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-20 px-6 py-6 border-b border-skin-border/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-skin-primary to-skin-secondary rounded-lg shadow-lg shadow-skin-primary/20" />
            <span className="text-xl font-bold tracking-tight">Vivaply</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => openAuth("login")}
              className="text-sm font-medium text-skin-muted hover:text-skin-text transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuth("register")}
              className="px-4 py-2 text-sm font-medium bg-skin-text text-skin-base rounded-full hover:bg-skin-text/90 transition-transform transform hover:scale-105 shadow-lg shadow-skin-text/10"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background blobs/effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-skin-secondary/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute top-40 right-10 w-[500px] h-[500px] bg-skin-primary/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-skin-primary/20 bg-skin-primary/10 text-skin-primary text-xs font-semibold tracking-wide uppercase mb-6">
              <SparklesIcon className="w-4 h-4 mr-2" />
              The Future of Personal Library
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
              Organize your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-skin-primary via-skin-muted to-skin-secondary">
                Digital Universe
              </span>
            </h1>
            <p className="text-lg text-skin-muted mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Vivaply brings your books, movies, and knowledge together in one
              stunning, interconnected space. Experience the next generation of
              personal library management.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => openAuth("register")}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-skin-primary to-skin-secondary hover:from-skin-primary/90 hover:to-skin-secondary/90 text-skin-base rounded-xl font-bold shadow-lg shadow-skin-primary/25 transition-all transform hover:-translate-y-1 hover:shadow-xl"
              >
                Join for Free
              </button>
              <button
                onClick={() => openAuth("login")}
                className="w-full sm:w-auto px-8 py-4 bg-skin-surface border border-skin-border/5 hover:bg-skin-surface/80 text-skin-text rounded-xl font-semibold transition-all"
              >
                Existing User?
              </button>
            </div>
          </div>

          <div className="relative lg:h-[600px] w-full flex items-center justify-center">
            {/* Hero Image Container */}
            <div className="relative w-full max-w-lg aspect-square lg:aspect-auto h-full rounded-2xl overflow-hidden border border-skin-border/10 shadow-2xl shadow-skin-primary/10">
              <img
                src={landingHero}
                alt="App Interface Preview"
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700 hover:scale-105 transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-skin-base via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-skin-surface/30 border-t border-skin-border/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need in one place
            </h2>
            <p className="text-skin-muted">
              Stop juggling multiple apps. Vivaply unifies your entertainment
              and learning journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FilmIcon className="w-8 h-8" />}
              title="Entertainment Tracking"
              description="Keep track of movies, TV shows, and anime you've watched or plan to watch. Get personalized recommendations."
            />
            <FeatureCard
              icon={<BookOpenIcon className="w-8 h-8" />}
              title="Smart Bookshelf"
              description="Organize your reading list, take notes, and track your reading progress with our intuitive book management system."
            />
            <FeatureCard
              icon={<GlobeAltIcon className="w-8 h-8" />}
              title="Knowledge Base"
              description="Connect your learnings. Link notes from books to movies and build a personal knowledge graph."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-skin-border/5 bg-skin-base text-center text-skin-muted text-sm flex flex-col items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Vivaply. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <span className="text-xs">Theme:</span>
          <ThemeToggle />
        </div>
      </footer>

      {/* Helper Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-skin-surface border border-skin-border/5 hover:border-skin-border/20 transition-colors group">
      <div className="mb-6 p-4 rounded-xl bg-skin-base w-fit group-hover:scale-110 group-hover:text-skin-primary transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:text-skin-primary transition-colors">
        {title}
      </h3>
      <p className="text-skin-muted leading-relaxed">{description}</p>
    </div>
  );
}
