'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { categories } from '@/lib/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

interface CategoryFilterProps {
  onCategoryChange?: (categoryId: string | null) => void;
}

export default function CategoryFilter({ onCategoryChange }: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? null : categoryId;
    setSelectedCategory(newCategory);
    onCategoryChange?.(newCategory);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative"
    >
      <div className="flex items-center gap-4">
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors absolute -left-4 top-1/2 -translate-y-1/2 z-10"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Categories Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide md:pb-0"
        >
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleCategoryClick(category.id)}
              className={`
                flex-shrink-0 px-5 py-3 rounded-full border-2 font-medium
                transition-all duration-200 whitespace-nowrap
                ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:border-primary text-foreground'
                }
              `}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </motion.button>
          ))}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors absolute -right-4 top-1/2 -translate-y-1/2 z-10"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Custom scrollbar hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}
