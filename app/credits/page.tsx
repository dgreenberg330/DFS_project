// ============================================================================
// Credits & Attribution Page
// ============================================================================

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credits & Attribution | Shugsy',
  description: 'Data sources and attribution for Shugsy.',
  robots: { index: false },
};

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-100 mb-8">Credits &amp; Attribution</h1>

        {/* TMDB Attribution */}
        <section className="bg-dark-surface rounded-lg border border-dark-border p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
              alt="TMDB - The Movie Database"
              className="h-6"
            />
          </div>
          <p className="text-sm text-gray-300 mb-3">
            This product uses the{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light hover:underline"
            >
              TMDB API
            </a>{' '}
            but is not endorsed or certified by TMDB.
          </p>
          <p className="text-sm text-gray-400">
            All movie metadata, including poster artwork, is supplied by{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light hover:underline"
            >
              The Movie Database (TMDB)
            </a>
            . To report inaccurate movie data, please visit{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light hover:underline"
            >
              themoviedb.org
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
