/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/x',
        destination: '/?utm_source=twitter&utm_medium=social',
        permanent: false,
      },
      {
        source: '/ig',
        destination: '/?utm_source=instagram&utm_medium=social',
        permanent: false,
      },
      {
        source: '/r',
        destination: '/?utm_source=reddit&utm_medium=social',
        permanent: false,
      },
      {
        source: '/fb',
        destination: '/?utm_source=facebook&utm_medium=social',
        permanent: false,
      },
      {
        source: '/tt',
        destination: '/?utm_source=tiktok&utm_medium=social',
        permanent: false,
      },
      {
        source: '/li',
        destination: '/?utm_source=linkedin&utm_medium=social',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
