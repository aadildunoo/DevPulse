import {
  Article,
  ArticleDetail,
  Category,
  Technology,
  Source,
  SecurityAdvisory,
  Repository,
  DailyBriefing,
  SearchResponse,
  PaginatedResponse,
  UserProfile,
  MarketOverview,
  StockQuote,
  FinancialResult,
  Company,
  WatchlistItem,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`Request to ${url} failed:`, err);
    throw err;
  }
}

export const api = {
  // Articles
  getArticles: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return fetchJson<PaginatedResponse<Article>>(`/articles/?${query.toString()}`);
  },

  getArticle: (slug: string) => {
    return fetchJson<ArticleDetail>(`/articles/${slug}/`);
  },

  getBreakingNews: () => {
    return fetchJson<{ count: number; timestamp: string; results: Article[] }>('/articles/breaking/');
  },

  getTrendingNews: () => {
    return fetchJson<{ count: number; results: Article[] }>('/articles/trending/');
  },

  getForYouFeed: () => {
    return fetchJson<{ feed_type: string; results: Article[] }>('/feed/');
  },

  // Categories & Technologies
  getCategories: () => {
    return fetchJson<Category[]>('/categories/');
  },

  getSources: () => {
    return fetchJson<Source[]>('/sources/');
  },

  getTechnologies: (params: { category?: string; trending?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.trending) query.append('trending', 'true');
    return fetchJson<Technology[]>(`/technologies/?${query.toString()}`);
  },

  getTechnology: (slug: string) => {
    return fetchJson<Technology>(`/technologies/${slug}/`);
  },

  toggleFollowTechnology: (slug: string) => {
    return fetchJson<{ technology: string; slug: string; is_following: boolean }>(
      `/technologies/${slug}/follow/`,
      { method: 'POST' }
    );
  },

  // Daily Briefing
  getDailyBriefing: () => {
    return fetchJson<DailyBriefing>('/briefing/');
  },

  // Security Center
  getSecurityAdvisories: (params: { severity?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.severity) query.append('severity', params.severity);
    if (params.search) query.append('search', params.search);
    return fetchJson<PaginatedResponse<SecurityAdvisory>>(`/security/?${query.toString()}`);
  },

  getSecurityAdvisory: (slug: string) => {
    return fetchJson<SecurityAdvisory>(`/security/${slug}/`);
  },

  // Open Source Explorer
  getRepositories: (params: { language?: string; maintenance_status?: string; featured?: boolean; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.language) query.append('language', params.language);
    if (params.maintenance_status) query.append('maintenance_status', params.maintenance_status);
    if (params.featured) query.append('featured', 'true');
    if (params.search) query.append('search', params.search);
    return fetchJson<PaginatedResponse<Repository>>(`/repositories/?${query.toString()}`);
  },

  // Global Search
  search: (query: string) => {
    return fetchJson<SearchResponse>(`/search/?q=${encodeURIComponent(query)}`);
  },

  // Technology Stock Markets & Financial Desk
  getMarketOverview: () => {
    return fetchJson<MarketOverview>('/markets/overview/');
  },

  getStocks: (params: { sector?: string; search?: string; sort?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.sector) query.append('sector', params.sector);
    if (params.search) query.append('search', params.search);
    if (params.sort) query.append('sort', params.sort);
    return fetchJson<{ count: number; session: any; results: StockQuote[] }>(`/markets/stocks/?${query.toString()}`);
  },

  getStock: (ticker: string) => {
    return fetchJson<{
      quote: StockQuote;
      company: Company;
      financials: FinancialResult[];
      related_articles: Article[];
      session: any;
    }>(`/markets/stocks/${encodeURIComponent(ticker)}/`);
  },

  getMarketMovers: () => {
    return fetchJson<{
      session: any;
      gainers: StockQuote[];
      losers: StockQuote[];
      most_active: StockQuote[];
    }>('/markets/movers/');
  },

  getCompany: (slug: string) => {
    return fetchJson<{
      company: Company;
      quote: StockQuote | null;
      financials: FinancialResult[];
      related_news: Article[];
    }>(`/markets/companies/${encodeURIComponent(slug)}/`);
  },

  getWatchlist: () => {
    return fetchJson<{ items: WatchlistItem[] }>('/markets/watchlist/');
  },

  addToWatchlist: (ticker: string) => {
    return fetchJson<{ message: string; created: boolean; item: WatchlistItem }>('/markets/watchlist/', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    });
  },

  removeFromWatchlist: (ticker: string) => {
    return fetchJson<{ message: string; deleted: boolean }>(`/markets/watchlist/?ticker=${encodeURIComponent(ticker)}`, {
      method: 'DELETE',
    });
  },

  // Bookmarks
  getBookmarks: () => {
    return fetchJson<PaginatedResponse<{ id: number; article: Article; created_at: string }>>('/bookmarks/');
  },

  addBookmark: (articleId: number) => {
    return fetchJson<{ id: number }>('/bookmarks/', {
      method: 'POST',
      body: JSON.stringify({ article_id: articleId }),
    });
  },

  removeBookmark: (articleId: number) => {
    return fetchJson<{ message: string }>(`/bookmarks/${articleId}/`, {
      method: 'DELETE',
    });
  },

  // Auth
  getCurrentUser: () => {
    return fetchJson<{ authenticated: boolean; user: UserProfile | null }>('/auth/me/');
  },

  updateProfile: (data: { role_title?: string; theme_preference?: string; email_digest_frequency?: string }) => {
    return fetchJson<UserProfile>('/auth/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  login: (username: string, password: string) => {
    return fetchJson<UserProfile>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: (data: { username: string; email?: string; password: string; role_title?: string }) => {
    return fetchJson<UserProfile>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    return fetchJson<{ message: string }>('/auth/logout/', {
      method: 'POST',
    });
  },

  // System & Health Telemetry
  getHealth: () => {
    return fetchJson<{
      status: string;
      timestamp: string;
      database_connected: boolean;
      metrics: {
        total_articles: number;
        total_security_advisories: number;
        total_repositories: number;
        active_sources: number;
        degraded_sources: number;
        latest_ingestion_status: string;
      };
    }>('/health/');
  },

  getIngestionJobs: () => {
    return fetchJson<
      Array<{
        id: number;
        source_name: string;
        status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
        items_found: number;
        items_created: number;
        items_updated: number;
        error_message: string;
        started_at: string;
        completed_at: string | null;
      }>
    >('/ingest/');
  },

  triggerIngestion: (sourceSlug?: string, force: boolean = false) => {
    return fetchJson<any>('/ingest/', {
      method: 'POST',
      body: JSON.stringify({ source_slug: sourceSlug, force }),
    });
  },
};

