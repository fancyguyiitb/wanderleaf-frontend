'use client';

import { useState } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import PropertyCard from '@/components/property-card';
import { Sparkles, Send, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listingsApi } from '@/lib/api';
import { Property } from '@/lib/store';

interface SearchResult {
  query: string;
  results: Property[];
  tags: string[];
}

export default function AISearchPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [currentResults, setCurrentResults] = useState<SearchResult | null>(null);

  const suggestions = [
    'A cozy cabin near mountains for 4 people under ₹5,000 per night',
    'Beachfront villa with pool in tropical location',
    'Luxury alpine chalet with skiing access',
    'Eco-friendly forest retreat with WiFi',
    'Mediterranean villa near wine country',
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setQuery(searchQuery);

    try {
      const allListings = await listingsApi.getAll();

      const keywords = searchQuery.toLowerCase();
      const isMountain = keywords.includes('mountain') || keywords.includes('cabin') || keywords.includes('forest');
      const isBeach = keywords.includes('beach') || keywords.includes('ocean') || keywords.includes('coastal');
      const isLuxury = keywords.includes('luxury') || keywords.includes('villa') || keywords.includes('premium');

      let filteredResults = allListings;
      if (isMountain) {
        filteredResults = allListings.filter((p) =>
          p.location.toLowerCase().includes('mountain') ||
          p.title.toLowerCase().includes('cabin') ||
          p.title.toLowerCase().includes('forest')
        );
      } else if (isBeach) {
        filteredResults = allListings.filter((p) =>
          p.location.toLowerCase().includes('beach') ||
          p.title.toLowerCase().includes('beach') ||
          p.location.toLowerCase().includes('coast')
        );
      } else if (isLuxury) {
        filteredResults = allListings.filter((p) => p.price > 200);
      }

      if (filteredResults.length === 0) {
        filteredResults = allListings;
      }

      const tags: string[] = [];
      if (isMountain) tags.push('Mountain');
      if (isBeach) tags.push('Beach');
      if (isLuxury) tags.push('Luxury');
      if (keywords.includes('4 people') || keywords.includes('family')) tags.push('Family-Friendly');
      if (keywords.includes('₹5,000') || keywords.includes('5000')) tags.push('Budget-Friendly');

      const result: SearchResult = {
        query: searchQuery,
        results: filteredResults,
        tags: tags.length > 0 ? tags : ['Recommended'],
      };

      setCurrentResults(result);
      setSearchHistory((prev) => [result, ...prev].slice(0, 5));
    } catch {
      setCurrentResults({
        query: searchQuery,
        results: [],
        tags: ['Error'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="text-accent" size={32} />
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground">
              AI-Powered Search
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe your dream stay in natural language, and our AI will find the perfect properties for you
          </p>
        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex gap-2"
            >
              <div className="flex-1 relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input
                  type="text"
                  placeholder="Describe your ideal stay... (e.g., 'A cozy cabin near mountains for 4 people under ₹5,000 per night')"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 text-lg"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading || !query.trim()}
                className="px-6 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    <span className="hidden sm:inline">Searching...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Suggestions */}
          {!currentResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 10 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <p className="text-sm font-semibold text-muted-foreground mb-3">Try these searches:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSuggestClick(suggestion)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-foreground"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="inline-flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="text-primary" size={48} />
                </motion.div>
                <div>
                  <p className="text-lg font-semibold text-foreground mb-2">Finding your perfect stay...</p>
                  <p className="text-muted-foreground">Our AI is analyzing properties based on your description</p>
                </div>
              </div>
            </motion.div>
          )}

          {currentResults && !isLoading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {/* Results Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-playfair text-2xl font-bold text-foreground">
                      AI Results
                    </h2>
                    <p className="text-muted-foreground">
                      Found {currentResults.results.length} properties matching your description
                    </p>
                  </div>
                  <button
                    onClick={() => setQuery('')}
                    className="px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors self-start sm:self-auto"
                  >
                    New Search
                  </button>
                </div>

                {/* AI Tags */}
                <div className="flex flex-wrap gap-2">
                  {currentResults.tags.map((tag, index) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Properties Grid */}
              {currentResults.results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentResults.results.map((property, index) => (
                    <PropertyCard key={property.id} property={property} index={index} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search criteria or use one of the suggestions above
                  </p>
                  <button
                    onClick={() => handleSearch('Recommended stays')}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    View All Properties
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search History */}
        {searchHistory.length > 0 && !currentResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 pt-12 border-t border-border"
          >
            <h3 className="font-playfair text-xl font-bold text-foreground mb-6">Recent Searches</h3>
            <div className="space-y-3">
              {searchHistory.map((item, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSearch(item.query)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-foreground group-hover:text-primary transition-colors">{item.query}</p>
                    <span className="text-xs text-muted-foreground">{item.results.length} results</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
