'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');

  const handleSearch = () => {
    console.log({ location, checkIn, checkOut, guests });
    // Handle search
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="max-w-5xl mx-auto">
        <div
          className={`
            bg-white rounded-full shadow-lg border border-border
            transition-all duration-300
            ${isExpanded ? 'shadow-2xl' : 'hover:shadow-xl'}
          `}
        >
          <div
            className={`
              flex items-center gap-4 px-6 py-3
              ${isExpanded ? 'flex-col gap-6 md:flex-row py-6' : ''}
            `}
          >
            {/* Location Input */}
            <div className="flex-1 flex items-center gap-3 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
              <MapPin size={20} className="text-primary flex-shrink-0" />
              <input
                type="text"
                placeholder="Where to?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
              />
            </div>

            {/* Check-in Date */}
            <div
              className={`
                flex items-center gap-3 flex-1
                ${isExpanded ? 'w-full border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4' : ''}
              `}
            >
              <Calendar size={20} className="text-primary flex-shrink-0" />
              <input
                type="date"
                placeholder="Check in"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
              />
            </div>

            {/* Check-out Date */}
            <div
              className={`
                flex items-center gap-3 flex-1
                ${isExpanded ? 'w-full border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4' : ''}
              `}
            >
              <Calendar size={20} className="text-primary flex-shrink-0" />
              <input
                type="date"
                placeholder="Check out"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
              />
            </div>

            {/* Guests */}
            <div className={`flex items-center gap-3 flex-1 ${isExpanded ? 'w-full border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4' : ''}`}>
              <Users size={20} className="text-primary flex-shrink-0" />
              <input
                type="number"
                placeholder="Guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
                min="1"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0 hover:scale-110 transform"
            >
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
