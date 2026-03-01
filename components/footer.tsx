'use client';

import Link from 'next/link';
import { Globe, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const footerSections = [
    {
      title: 'Support',
      links: [
        { label: 'Safety Info', href: '/safety' },
        { label: 'Cancellation Options', href: '/cancellation' },
        { label: 'Report Concern', href: '/report' },
      ],
    },
    {
      title: 'Hosting',
      links: [
        { label: 'Host a Home', href: '/host' },
        { label: 'Responsible Hosting', href: '/responsible-hosting' },
        { label: 'Community Guidelines', href: '/community-guidelines' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
      ],
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
                {section.links.map((link: { label: string; href: string }) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      {link.label}
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

          {/* Right: Social Icons - Coming Soon */}
          <div className="flex items-center gap-6">
            <Link href="/coming-soon" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
              <Facebook size={18} />
            </Link>
            <Link href="/coming-soon" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
              <Instagram size={18} />
            </Link>
            <Link href="/coming-soon" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
              <Twitter size={18} />
            </Link>
            <Link href="/coming-soon" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
              <Linkedin size={18} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
