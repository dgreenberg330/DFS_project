import type { Metadata } from 'next'
import './globals.css'
import { OrganizationJsonLd } from '@/components/json-ld'

const siteUrl = 'https://shugsy.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Shugsy - Fantasy Sports for the Box Office',
    template: '%s | Shugsy',
  },
  description: 'Free fantasy sports game for movie box office. Pick your lineup of movies, predict opening weekend grosses, and compete on the leaderboard.',
  keywords: [
    'box office fantasy',
    'movie fantasy sports',
    'predict box office',
    'opening weekend predictions',
    'box office game',
    'movie prediction contest',
    'fantasy movies',
    'weekend box office contest',
  ],
  authors: [{ name: 'Shugsy' }],
  creator: 'Shugsy',
  publisher: 'Shugsy',
  icons: {
    icon: '/logo_s.png',
    apple: '/logo_s.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Shugsy',
    title: 'Shugsy - Fantasy Sports for the Box Office',
    description: 'Free fantasy sports game for movie box office. Pick your lineup of movies, predict opening weekend grosses, and compete on the leaderboard.',
    images: [
      {
        url: '/logo_full.png',
        width: 1200,
        height: 630,
        alt: 'Shugsy - Box Office Fantasy Sports',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shugsy - Fantasy Sports for the Box Office',
    description: 'Free fantasy sports game for movie box office. Pick your lineup of movies and compete on the leaderboard.',
    images: ['/logo_full.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  )
}
