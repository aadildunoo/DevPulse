export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
}

export interface Technology {
  id: number;
  name: string;
  slug: string;
  description: string;
  website: string;
  doc_url: string;
  github_repo: string;
  icon: string;
  is_trending: boolean;
  follower_count: number;
  category_slug?: string;
}

export interface Source {
  id: number;
  name: string;
  slug: string;
  source_type: string;
  url: string;
  site_url: string;
  reliability_tier: 'authoritative' | 'verified' | 'community';
  is_active: boolean;
  last_polled_at: string | null;
  last_success_at: string | null;
  consecutive_failures: number;
}

export interface ArticleIntelligence {
  concise_summary: string;
  detailed_summary: string;
  what_happened: string;
  why_it_matters: string;
  developer_impact: string;
  positive_implications: string[];
  negative_implications: string[];
  risks_and_limitations: string[];
  recommended_actions: string[];
  affected_versions: string;
  who_is_affected: string;
  supporting_evidence: string[];
  uncertainty_notes: string;
  provider: string;
  updated_at: string;
}

export interface ArticleCorrection {
  id: number;
  original_claim: string;
  correction_text: string;
  corrected_at: string;
  editor_notes: string;
}

export interface Article {
  id: number;
  title: string;
  subheadline?: string;
  slug: string;
  canonical_url: string;
  original_url: string;
  author: string;
  editorial_desk?: string;
  article_type?: 'standard_news' | 'breaking_news' | 'major_development' | 'company_analysis' | 'technical_explainer' | 'market_report' | string;
  source_name: string;
  source_slug: string;
  source_tier: 'authoritative' | 'verified' | 'community';
  category_name: string;
  category_slug: string;
  technologies: Technology[];
  primary_event_type: 'release' | 'breaking_change' | 'security_vulnerability' | 'research_paper' | 'ai_model' | 'developer_tools' | 'outage' | 'industry_news' | 'tech_layoffs' | 'market_movement' | 'funding_round' | 'acquisition' | 'regulatory_policy' | string;
  primary_companies?: string[];
  stock_symbols?: string[];
  lead_image_url?: string;
  lead_image_caption?: string;
  editorial_status?: string;
  importance_score: number;
  importance_explanation: string;
  is_breaking: boolean;
  is_developing: boolean;
  is_editorial_pick: boolean;
  read_time_minutes: number;
  published_at: string;
  updated_at?: string | null;
  ingested_at: string;
  concise_summary: string;
}

export interface ArticleDetail extends Omit<Article, 'source_name' | 'source_slug' | 'source_tier' | 'category_name' | 'category_slug'> {
  source: Source;
  category: Category | null;
  summary_raw: string;
  content_raw: string;
  body_paragraphs?: string[];
  paragraphs?: string[];
  background_context?: string;
  why_it_matters_text?: string;
  implications_analysis?: string;
  what_happens_next?: string;
  sources_and_references?: Array<{ title: string; url: string; publisher: string }>;
  lead_image_credit?: string;
  ai_generation_status?: string;
  verification_status?: string;
  view_count: number;
  bookmark_count: number;
  is_reviewed: boolean;
  intelligence: ArticleIntelligence | null;
  corrections: ArticleCorrection[];
  related_articles: Article[];
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  ticker: string;
  exchange: string;
  sector: string;
  industry: string;
  website: string;
  description: string;
  founded_year: number | null;
  headquarters: string;
  ceo: string;
  employee_count: number | null;
  is_public: boolean;
  logo_url: string;
}

export interface MarketIndex {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  current_value: string | number;
  change: string | number;
  change_percent: string | number;
  previous_close?: string | number | null;
  day_high?: string | number | null;
  day_low?: string | number | null;
  market_status: string;
  is_delayed: boolean;
  last_updated: string;
}

export interface StockQuote {
  id: number;
  ticker: string;
  company_name: string;
  exchange: string;
  sector: string;
  company: Company;
  current_price: string | number;
  change: string | number;
  change_percent: string | number;
  open_price?: string | number | null;
  high_price?: string | number | null;
  low_price?: string | number | null;
  previous_close?: string | number | null;
  volume: number;
  avg_volume?: number | null;
  market_cap?: number | null;
  market_cap_formatted: string;
  pe_ratio?: string | number | null;
  week_52_high?: string | number | null;
  week_52_low?: string | number | null;
  earnings_date?: string | null;
  market_status: string;
  is_delayed: boolean;
  provider: string;
  movement_context: string;
  last_updated: string;
}

export interface FinancialResult {
  id: number;
  ticker: string;
  company_name: string;
  fiscal_period: string;
  fiscal_year: number;
  report_date: string;
  revenue: number | null;
  revenue_formatted: string;
  revenue_growth_yoy: string | number | null;
  net_income: number | null;
  net_income_formatted: string;
  eps: string | number | null;
  capex: number | null;
  capex_formatted: string;
  guidance_summary: string;
  source_filing_url: string;
  created_at: string;
}

export interface MarketSession {
  status: string;
  is_open: boolean;
  session: 'regular' | 'pre_market' | 'after_hours' | 'closed' | 'weekend';
  is_delayed: boolean;
  timestamp: string;
  eastern_time: string;
  next_session: string;
}

export interface MarketOverview {
  session: MarketSession;
  indices: MarketIndex[];
  gainers: StockQuote[];
  losers: StockQuote[];
  most_active: StockQuote[];
  mega_caps: StockQuote[];
  last_updated: string;
  provider_notice: string;
}

export interface WatchlistItem {
  id: number;
  company: Company;
  quote: StockQuote | null;
  created_at: string;
}

export interface SecurityAdvisory {
  id: number;
  advisory_id: string;
  cve_id: string | null;
  title: string;
  slug: string;
  summary: string;
  details: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss_score: number | null;
  affected_product: string;
  affected_versions: string;
  patched_versions: string;
  remediation_guide: string;
  references: string[];
  source_url: string;
  technology_name?: string;
  technology_slug?: string;
  article_slug?: string;
  published_at: string;
  updated_at: string;
}

export interface Repository {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  slug: string;
  description: string;
  repo_url: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  primary_language: string;
  topics: string[];
  license_name: string;
  latest_release_tag: string;
  latest_release_name: string;
  latest_release_date: string | null;
  maintenance_status: 'highly_active' | 'active' | 'maintenance_only' | 'slow' | 'deprecated';
  is_featured: boolean;
  last_synced_at: string;
}

export interface DailyBriefing {
  id: number;
  date: string;
  title: string;
  overview: string;
  reading_time_minutes: number;
  top_stories: Article[];
  created_at: string;
}

export interface SearchResponse {
  query: string;
  total_article_matches?: number;
  articles: Article[];
  technologies: Technology[];
  companies?: Company[];
  advisories: SecurityAdvisory[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_title: string;
  theme_preference: 'dark' | 'light' | 'system';
  followed_technologies: Technology[];
  preferred_categories: Category[];
}
