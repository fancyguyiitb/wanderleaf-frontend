'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationSuggestion {
  id: string;
  name: string;
  region: string;
  country: string;
  display: string;
}

interface PhotonProperties {
  name?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface PhotonFeature {
  properties?: PhotonProperties;
  geometry?: {
    coordinates?: [number, number];
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

function formatPhotonFeature(feature: PhotonFeature): LocationSuggestion {
  const props = feature.properties ?? {};
  const [longitude = 0, latitude = 0] = feature.geometry?.coordinates ?? [];
  const parts: string[] = [];

  const name = props.name || props.city || props.county || '';
  const state = props.state || '';
  const country = props.country || '';

  if (props.city && props.city !== name) parts.push(props.city);
  if (state) parts.push(state);

  return {
    id: `${longitude}-${latitude}`,
    name,
    region: parts.join(', '),
    country,
    display: [name, ...parts, country].filter(Boolean).join(', '),
  };
}

interface SearchBarProps {
  onSearch?: (params: { location: string; checkIn: string; checkOut: string; guests: string }) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [location, setLocation] = useState('');
  const [locationSearchName, setLocationSearchName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const locationWrapperRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingSuggestions(true);

    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en&layer=city&layer=state&layer=country`,
        { signal: controller.signal }
      );
      const data: PhotonResponse = await res.json();

      const results: LocationSuggestion[] = (data.features ?? []).map(formatPhotonFeature);

      const seen = new Set<string>();
      const unique = results.filter((s) => {
        if (seen.has(s.display)) return false;
        seen.add(s.display);
        return true;
      });

      setSuggestions(unique);
      setShowSuggestions(unique.length > 0);
      setHighlightedIndex(-1);
    } catch (err: unknown) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setLocationSearchName('');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.display);
    setLocationSearchName(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showSuggestions || !locationWrapperRef.current) {
      setDropdownPos(null);
      return;
    }
    const updatePos = () => {
      const rect = locationWrapperRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownPos({
          top: rect.bottom + 8 + window.scrollY,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 320),
        });
      }
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [showSuggestions, suggestions]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleSearch = () => {
    setShowSuggestions(false);
    setIsExpanded(false);
    onSearch?.({
      location: locationSearchName || location,
      checkIn,
      checkOut,
      guests,
    });
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
            <div ref={locationWrapperRef} className="flex-1 flex items-center gap-3 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
              <MapPin size={20} className="text-primary flex-shrink-0" />
              <input
                ref={locationInputRef}
                type="text"
                placeholder="Where to?"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => {
                  setIsExpanded(true);
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={handleLocationKeyDown}
                autoComplete="off"
                className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
              />
              {isLoadingSuggestions && (
                <Loader2 size={16} className="animate-spin text-muted-foreground flex-shrink-0" />
              )}
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

      {/* Suggestions Dropdown — portaled to document.body to escape all overflow clipping */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && dropdownPos && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  zIndex: 9999,
                }}
                className="bg-white rounded-xl shadow-xl border border-border overflow-hidden"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                      index === highlightedIndex
                        ? 'bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {suggestion.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[suggestion.region, suggestion.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
}
