'use client';

import Link from 'next/link';
import { Globe, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const footerSections = [
    {
      title: 'Support',
      links: ['Help Center', 'Safety Info', 'Cancellation Options', 'Report Concern'],
    },
    {
      title: 'Hosting',
      links: ['Host a Home', 'Host an Experience', 'Responsible Hosting', 'Community Guidelines'],
    },
    {
      title: 'About',
      links: ['About Us', 'Blog', 'Careers', 'Press'],
    },
    {
      title: 'Legal',
      links: ['Terms', 'Privacy', 'Cookie Settings', 'Accessibility'],
    },
  ];

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Copyright & Language */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <p className="text-muted-foreground text-sm">
              © 2024 WanderLeaf, Inc. All rights reserved
            </p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer">
              <Globe size={16} />
              <span className="text-sm font-medium">English (US)</span>
            </div>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-6">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Facebook size={18} />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram size={18} />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter size={18} />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin size={18} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
