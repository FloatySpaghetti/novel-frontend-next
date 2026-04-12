// app/sitemap.xml/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// This is the SITEMAP INDEX. It fetches all URLs, stores them in the shared
// cache, then returns an XML index pointing Google to each chunk:
//   /sitemap/1.xml, /sitemap/2.xml, etc.
//
// Submit THIS URL to Google Search Console: https://noveltavern.com/sitemap.xml
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { sitemapCache, CHUNK_SIZE, CACHE_TTL_MS, SitemapUrl } from "@/lib/sitemap-cache";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/$/, "");

const slugify = (str: string) => str?.trim().replace(/\s+/g, "-").toLowerCase();

const getNovels = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/novels`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Novels fetch failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("❌ Failed to fetch novels:", error);
    return [];
  }
};

const getChapters = async (novelId: string) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chapters/novel/${encodeURIComponent(novelId)}?limit=1000000`,
      {
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      }
    );
    if (!res.ok) throw new Error(`Chapters fetch failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error(`❌ Failed to fetch chapters for novel ${novelId}:`, error);
    return [];
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// Builds the full URL list and populates the shared cache
async function buildAndCacheUrls(): Promise<SitemapUrl[]> {
  const staticPaths = [
    "browse", "genres", "contact", "terms",
    "privacy", "search", "signin", "signup", "profile",
  ];

  const urls: SitemapUrl[] = [
    { loc: `${baseUrl}/`, lastmod: new Date().toISOString(), changefreq: "daily", priority: "1.0" },
    ...staticPaths.map((path) => ({
      loc: `${baseUrl}/${path}`,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  const novels = await getNovels();
  console.log(`✅ Fetched ${novels.length} novels for sitemap`);

  for (const novel of novels) {
    if (!novel?.title) continue;
    const slug = slugify(novel.title);

    urls.push({
      loc: `${baseUrl}/novel/${slug}`,
      lastmod: novel.updated_at || novel.created_at || new Date().toISOString(),
      changefreq: "weekly",
      priority: "0.9",
    });

    try {
      const chapters = await getChapters(novel.id?.toString() || novel.title);
      for (const chapter of chapters) {
        if (!chapter?.chapter_number) continue;
        urls.push({
          loc: `${baseUrl}/novel/${slug}/chapter/${chapter.chapter_number}`,
          lastmod: chapter.updated_at || chapter.created_at || new Date().toISOString(),
          changefreq: "monthly",
          priority: "0.7",
        });
      }
    } catch (err) {
      console.error(`❌ Skipped chapters for ${novel.title}:`, err);
    }
  }

  // Populate shared cache for chunk routes to read
  sitemapCache.urls = urls;
  sitemapCache.generatedAt = Date.now();
  sitemapCache.totalChunks = Math.ceil(urls.length / CHUNK_SIZE);

  console.log(`✅ Sitemap cache built: ${urls.length} URLs → ${sitemapCache.totalChunks} chunks`);
  return urls;
}

export async function GET() {
  try {
    // Rebuild cache if stale or empty
    const isCacheStale = Date.now() - sitemapCache.generatedAt > CACHE_TTL_MS;
    if (sitemapCache.urls.length === 0 || isCacheStale) {
      await buildAndCacheUrls();
    }

    const now = new Date().toISOString();

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: sitemapCache.totalChunks }, (_, i) => `  <sitemap>
    <loc>${baseUrl}/sitemap/${i + 1}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;

    return new NextResponse(sitemapIndex, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("❌ Error generating sitemap index:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
}
