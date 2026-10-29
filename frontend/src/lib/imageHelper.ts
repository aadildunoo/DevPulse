import { Article } from './types';

export interface ResolvedImage {
  url: string;
  caption: string;
  credit: string;
}

export const CATEGORY_FALLBACK_IMAGES: Record<string, ResolvedImage> = {
  'tech-markets': {
    url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80',
    caption: 'Silicon semiconductor wafer and enterprise AI accelerator hardware.',
    credit: 'Photo: Unsplash / Semiconductor Systems',
  },
  'ai-machine-learning': {
    url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80',
    caption: 'Neural network computing architecture and autonomous reasoning pipeline.',
    credit: 'Photo: Unsplash / Neural Intelligence',
  },
  'programming-frameworks': {
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Software engineering development workstation, code compilation, and architectural refactoring.',
    credit: 'Photo: Unsplash / Developer Workstation',
  },
  'software-engineering': {
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Software engineering development workstation, code compilation, and architectural refactoring.',
    credit: 'Photo: Unsplash / Developer Workstation',
  },
  'tech-layoffs': {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    caption: 'Silicon Valley technology corporate campus undergoing organizational restructuring.',
    credit: 'Photo: Unsplash / Editorial Architecture',
  },
  'cybersecurity': {
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    caption: 'Security operations center analyzing threat intelligence and vulnerability telemetry.',
    credit: 'Photo: Unsplash / Cybersecurity Desk',
  },
  'startups-funding': {
    url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
    caption: 'Technology founders and venture investors architecting early-stage venture product.',
    credit: 'Photo: Unsplash / Venture Lab',
  },
  'big-tech-business': {
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    caption: 'Global hyperscale cloud communications and data center network telemetry.',
    credit: 'Photo: Unsplash / Global Infrastructure',
  },
  'hardware-chips': {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    caption: 'Advanced semiconductor microarchitecture, packaging, and lithography.',
    credit: 'Photo: Unsplash / Silicon Fabrication',
  },
  'developer-tools': {
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    caption: 'Systems programming environment, compiler benchmarks, and developer productivity tools.',
    credit: 'Photo: Unsplash / Developer Systems',
  },
};

const DEFAULT_IMAGE: ResolvedImage = {
  url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  caption: 'DevPulse global technology intelligence journalism and industry analysis.',
  credit: 'DevPulse Editorial Archives',
};

export function getArticleImage(article?: Partial<Article> | null): ResolvedImage {
  if (!article) return DEFAULT_IMAGE;

  if (article.lead_image_url && article.lead_image_url.trim().length > 0) {
    return {
      url: article.lead_image_url,
      caption: article.lead_image_caption || article.title || 'DevPulse Technology News',
      credit: (article as any).lead_image_credit || 'DevPulse Editorial',
    };
  }

  const categorySlug = article.category_slug || '';
  if (CATEGORY_FALLBACK_IMAGES[categorySlug]) {
    return CATEGORY_FALLBACK_IMAGES[categorySlug];
  }

  // Check event type
  if (article.primary_event_type === 'tech_layoffs') {
    return CATEGORY_FALLBACK_IMAGES['tech-layoffs'];
  }
  if (article.primary_event_type === 'security_vulnerability') {
    return CATEGORY_FALLBACK_IMAGES['cybersecurity'];
  }
  if (article.primary_event_type === 'market_movement') {
    return CATEGORY_FALLBACK_IMAGES['tech-markets'];
  }
  if (article.primary_event_type === 'ai_model') {
    return CATEGORY_FALLBACK_IMAGES['ai-machine-learning'];
  }

  return DEFAULT_IMAGE;
}
