'use client';

import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { motion } from 'framer-motion';

interface InfoPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function InfoPageLayout({ title, children }: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-8"
        >
          {title}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-6"
        >
          {children}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
