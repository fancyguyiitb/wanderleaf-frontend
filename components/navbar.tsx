'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, User, LogIn, UserPlus, Sparkles, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userMode, setUserMode, isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const handleModeChange = (mode: 'guest' | 'host') => {
    setUserMode(mode);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-playfair font-bold text-lg">S</span>
            </div>
            <span className="font-playfair font-bold text-xl text-foreground hidden sm:block">
              WanderLeaf
            </span>
          </Link>

          {/* AI Search Bar */}
          <button
            onClick={() => router.push('/ai-search')}
            className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-4 px-5 py-2.5 rounded-full border border-border bg-muted/50 hover:bg-muted hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors flex-shrink-0">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium text-foreground leading-tight">
                Find your dream stay
              </span>
              <span className="text-xs text-muted-foreground leading-tight truncate">
                Describe it naturally — our AI does the rest
              </span>
            </div>
            <Search size={16} className="text-muted-foreground ml-auto flex-shrink-0" />
          </button>

          {/* Right Section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Guest / Host toggle */}
            {isAuthenticated && (
              <div className="hidden sm:flex bg-secondary rounded-full p-1 gap-1">
                <button
                  onClick={() => handleModeChange('guest')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    userMode === 'guest'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Guest
                </button>
                <button
                  onClick={() => handleModeChange('host')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    userMode === 'host'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Host
                </button>
              </div>
            )}

            {/* Profile / Auth buttons */}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:shadow-md transition-shadow"
              >
                <User size={18} />
                <span className="text-sm font-medium">
                  {user?.name || 'Profile'}
                </span>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-foreground hover:shadow-md transition-shadow text-sm font-medium"
                >
                  <LogIn size={16} />
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <UserPlus size={16} />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            <div className="flex flex-col gap-4 py-4">
              {/* Mobile AI Search Bar */}
              <button
                onClick={() => { router.push('/ai-search'); setIsMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors"
              >
                <Sparkles size={18} className="text-primary flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">Find your dream stay</span>
                  <span className="text-xs text-muted-foreground">AI-powered search</span>
                </div>
              </button>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <User size={18} />
                    {user?.name || 'Profile'}
                  </Link>

                  <div className="flex bg-secondary rounded-full p-1 gap-2">
                    <button
                      onClick={() => { handleModeChange('guest'); setIsMenuOpen(false); }}
                      className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        userMode === 'guest'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      Guest
                    </button>
                    <button
                      onClick={() => { handleModeChange('host'); setIsMenuOpen(false); }}
                      className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        userMode === 'host'
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      Host
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <LogIn size={18} />
                    Log In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <UserPlus size={18} />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
