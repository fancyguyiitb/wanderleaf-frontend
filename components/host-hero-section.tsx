'use client';

import { motion } from 'framer-motion';
import { Home, PlusCircle, TrendingUp } from 'lucide-react';

interface HostHeroSectionProps {
  onCreateProperty: () => void;
  listingCount: number;
}

export default function HostHeroSection({ onCreateProperty, listingCount }: HostHeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/10"
        style={{
          backgroundImage:
            'radial-gradient(at 20% 80%, rgba(228, 120, 76, 0.12) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(124, 179, 87, 0.12) 0px, transparent 50%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance">
            Share Your <span className="text-accent">Space</span> with the World
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            List your property, welcome travelers, and earn income from your unique nature-inspired
            accommodations.
          </p>
        </motion.div>

        {/* Stats & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-8"
        >
          {/* Quick Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-xl shadow-sm border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Home size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{listingCount}</p>
                <p className="text-xs text-muted-foreground">
                  {listingCount === 1 ? 'Active Listing' : 'Active Listings'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-xl shadow-sm border border-border">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">$0</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </div>

          {/* Create CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateProperty}
            className="flex items-center gap-3 px-8 py-4 bg-accent text-accent-foreground rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <PlusCircle size={22} />
            Create New Listing
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
