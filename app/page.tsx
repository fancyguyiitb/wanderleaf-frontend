'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import HeroSection from '@/components/hero-section';
import CategoryFilter from '@/components/category-filter';
import PropertyCard from '@/components/property-card';
import { usePropertyStore } from '@/lib/store';
import { mockProperties } from '@/lib/mock-data';
import { motion } from 'framer-motion';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { properties, setProperties } = usePropertyStore();

  useEffect(() => {
    // Initialize properties
    setProperties(mockProperties);
  }, [setProperties]);

  // Filter properties based on category (mock filtering)
  const filteredProperties = selectedCategory
    ? properties.slice(0, 4) // Mock filtering - show first 4 for specific category
    : properties;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <CategoryFilter onCategoryChange={setSelectedCategory} />
        </motion.div>

        {/* Properties Grid */}
        <section>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground">
              {selectedCategory ? 'Featured Stays' : 'Recommended Properties'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {filteredProperties.length} unique places to stay
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>

          {/* Empty State */}
          {filteredProperties.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search criteria</p>
            </motion.div>
          )}
        </section>

        {/* Trust Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-24 py-16 border-t border-border"
        >
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose StayNature?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We carefully curate nature-inspired accommodations with authentic experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🌍',
                title: 'Verified Hosts',
                description: 'All our hosts are verified and reviewed by our community',
              },
              {
                icon: '💰',
                title: 'Best Price Guarantee',
                description: 'Find the best rates with our transparent pricing policy',
              },
              {
                icon: '🛡️',
                title: 'Secure Booking',
                description: 'Your reservation is protected with our guarantee program',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-elegant p-8 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
