// ============================================================================
// JSON-LD Structured Data Components for SEO/AEO/GEO
// ============================================================================

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization schema for site-wide use
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Shugsy',
    url: 'https://shugsy.com',
    logo: 'https://shugsy.com/logo_full.png',
    description: 'Fantasy sports for movie box office. Predict opening weekend grosses and compete on the leaderboard.',
    sameAs: [],
  };
  return <JsonLd data={data} />;
}

// WebApplication schema for the app
export function WebApplicationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Shugsy',
    url: 'https://shugsy.com',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Free fantasy sports game for movie box office predictions. Pick your lineup of movies, stay under the salary cap, and score points based on opening weekend gross.',
  };
  return <JsonLd data={data} />;
}

// FAQ schema for landing page
export function FAQJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Shugsy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Shugsy is a free fantasy sports game for movie box office. Players pick a lineup of movies releasing each weekend, stay under a $100 salary cap, and score points based on domestic opening weekend gross.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does box office fantasy work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Each week, select 2-4 movies from the available slate while staying under the $100 salary cap. After the weekend, your score equals the total domestic opening weekend gross of your movies. $1 million box office = 1 point.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is scoring calculated in Shugsy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Scoring is based on Friday-Sunday domestic box office gross. Each $1 million in box office equals 1 point. Your final score is the sum of all your selected movies opening weekend grosses.',
        },
      },
      {
        '@type': 'Question',
        name: 'When do lineups lock?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Lineups lock every Thursday at 8PM Eastern Time, before movies begin their opening weekend on Friday.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Shugsy free to play?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Shugsy is completely free to play. Create an account with your email and start competing in weekly box office contests.',
        },
      },
    ],
  };
  return <JsonLd data={data} />;
}

// Event schema for contest pages
interface ContestEventJsonLdProps {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  url: string;
}

export function ContestEventJsonLd({
  name,
  description,
  startDate,
  endDate,
  url,
}: ContestEventJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    url,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url,
    },
    organizer: {
      '@type': 'Organization',
      name: 'Shugsy',
      url: 'https://shugsy.com',
    },
    isAccessibleForFree: true,
  };
  return <JsonLd data={data} />;
}

// BreadcrumbList schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return <JsonLd data={data} />;
}
