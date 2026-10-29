import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'http://localhost:3000';
  const now = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${baseUrl}/live`, lastModified: now, changeFrequency: 'always', priority: 0.9 },
    { url: `${baseUrl}/ai`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/frameworks`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/security`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/open-source`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/briefing`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/editorial`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Common technology hubs
  const techHubs = [
    'react',
    'nextjs',
    'typescript',
    'python',
    'django',
    'rust',
    'go',
    'docker',
    'kubernetes',
    'postgresql',
    'openai',
    'anthropic',
    'google-ai',
  ];

  const techRoutes: MetadataRoute.Sitemap = techHubs.map((slug) => ({
    url: `${baseUrl}/tech/${slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  return [...staticRoutes, ...techRoutes];
}
