import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import AuthHydrator from '@/components/auth-hydrator'
import { ThemeProvider } from '@/components/theme-provider'
import WishlistHydrator from '@/components/wishlist-hydrator'
import GlobalChatNotifications from '@/components/global-chat-notifications'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

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
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <AuthHydrator />
          <WishlistHydrator />
          <GlobalChatNotifications />
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
