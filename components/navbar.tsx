'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMode, setUserMode] = useState<'user' | 'owner'>('user');

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
            <Link href="/become-host" className="text-foreground hover:text-primary transition-colors text-sm font-medium">
              Switch to Hosting
            </Link>
            <button className="text-foreground hover:text-primary transition-colors">
              <Bell size={20} />
            </button>
            <button className="text-foreground hover:text-primary transition-colors">
              <Heart size={20} />
            </button>
          </div>

          {/* Auth & Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-secondary rounded-full p-1 gap-2">
              <button
                onClick={() => setUserMode('user')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  userMode === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                Guest
              </button>
              <button
                onClick={() => setUserMode('owner')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  userMode === 'owner'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                Host
              </button>
            </div>

            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:shadow-md transition-shadow">
              <User size={18} />
              <span className="text-sm font-medium">Profile</span>
            </button>

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
              <Link href="/become-host" className="text-foreground hover:text-primary transition-colors">
                Switch to Hosting
              </Link>
              <div className="flex bg-secondary rounded-full p-1 gap-2">
                <button
                  onClick={() => setUserMode('user')}
                  className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    userMode === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Guest
                </button>
                <button
                  onClick={() => setUserMode('owner')}
                  className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    userMode === 'owner'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  Host
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
