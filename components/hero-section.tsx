'use client';

import { motion } from 'framer-motion';
import SearchBar from './search-bar';

interface HeroSectionProps {
  onSearch?: (params: { location: string; checkIn: string; checkOut: string; guests: string }) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"
        style={{
          backgroundImage: 'radial-gradient(at 20% 80%, rgba(124, 179, 87, 0.1) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(228, 120, 76, 0.1) 0px, transparent 50%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance">
            Discover Nature's <span className="text-primary">Hidden Gems</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Find and book unique, nature-inspired accommodations around the world. From mountain retreats to beachfront escapes, explore your next perfect getaway.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SearchBar onSearch={onSearch} />
        </motion.div>
      </div>
    </section>
  );
}
