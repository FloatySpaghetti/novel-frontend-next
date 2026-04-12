// lib/sitemap-cache.ts
// Shared constants only — no in-memory state

export type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

export const CHUNK_SIZE = 15000; // Changed from 50000 to 15000
