import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shugsy - Fantasy Sports for the Box Office',
  description: 'Fantasy sports for movie box office',
  icons: {
    icon: '/logo_s.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
