import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import AuthHydrator from '@/components/auth-hydrator'
import WishlistHydrator from '@/components/wishlist-hydrator'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WanderLeaf - Find Your Perfect Getaway',
  description:
    'Discover unique, nature-inspired accommodations around the world. Book your dream stay with WanderLeaf.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthHydrator />
        <WishlistHydrator />
        {children}
      </body>
    </html>
  )
}
