// ============================================================================
// Robots.txt Configuration
// ============================================================================

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = 'https://www.shugsy.com'

  return {
    rules: [
      {
        userAgent: 'Twitterbot',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
