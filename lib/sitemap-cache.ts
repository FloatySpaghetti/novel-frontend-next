// lib/sitemap-cache.ts
// Shared in-memory cache between the sitemap index and chunk routes.
// Place this file at: lib/sitemap-cache.ts

export type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

export const sitemapCache: {
  urls: SitemapUrl[];
  generatedAt: number;
  totalChunks: number;
} = {
  urls: [],
  generatedAt: 0,
  totalChunks: 0,
};

export const CHUNK_SIZE = 50000;
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — matches revalidate: 3600
