// ============================================================================
// Dynamic Sitemap for SEO
// ============================================================================

import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const siteUrl = 'https://www.shugsy.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Create a simple Supabase client for sitemap generation (no auth needed)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )

  // Fetch all public contests (locked or resolved)
  const { data: contests } = await supabase
    .from('contests')
    .select('id, created_at, status')
    .in('status', ['locked', 'resolved'])
    .order('created_at', { ascending: false })

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/charts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic contest pages
  const contestPages: MetadataRoute.Sitemap = (contests || []).flatMap((contest) => {
    const pages: MetadataRoute.Sitemap = [
      {
        url: `${siteUrl}/contests/${contest.id}`,
        lastModified: new Date(contest.created_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ]

    // Add leaderboard page for resolved contests
    if (contest.status === 'resolved') {
      pages.push({
        url: `${siteUrl}/contests/${contest.id}/leaderboard`,
        lastModified: new Date(contest.created_at),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    return pages
  })

  return [...staticPages, ...contestPages]
}
