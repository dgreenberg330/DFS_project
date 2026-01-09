import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Box Office Fantasy',
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
