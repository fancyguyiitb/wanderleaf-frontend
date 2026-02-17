'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Heart, User, Bell, LogIn, UserPlus } from 'lucide-react';
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
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-playfair font-bold text-lg">S</span>
            </div>
            <span className="font-playfair font-bold text-xl text-foreground hidden sm:block">
              StayNature
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {userMode === 'guest' ? (
              <Link href="/" className="text-foreground hover:text-primary transition-colors text-sm font-medium">
                Switch to Hosting
              </Link>
            ) : (
              <Link href="/" className="text-foreground hover:text-accent transition-colors text-sm font-medium">
                Switch to Traveling
              </Link>
            )}
            {isAuthenticated && (
              <>
                <button className="text-foreground hover:text-primary transition-colors">
                  <Bell size={20} />
                </button>
                <button className="text-foreground hover:text-primary transition-colors">
                  <Heart size={20} />
                </button>
              </>
            )}
          </div>

          {/* Auth & Mode Toggle */}
          <div className="flex items-center gap-4">
            {/* Guest / Host toggle — only show when logged in */}
            {isAuthenticated && (
              <div className="hidden sm:flex bg-secondary rounded-full p-1 gap-2">
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
                href="/dashboard/profile"
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
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <User size={18} />
                    {user?.name || 'Profile'}
                  </Link>

                  {userMode === 'guest' ? (
                    <button
                      onClick={() => { handleModeChange('host'); setIsMenuOpen(false); }}
                      className="text-foreground hover:text-primary transition-colors text-left"
                    >
                      Switch to Hosting
                    </button>
                  ) : (
                    <button
                      onClick={() => { handleModeChange('guest'); setIsMenuOpen(false); }}
                      className="text-foreground hover:text-accent transition-colors text-left"
                    >
                      Switch to Traveling
                    </button>
                  )}

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
