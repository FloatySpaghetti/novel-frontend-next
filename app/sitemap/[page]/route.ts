// app/sitemap/[page]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Each chunk sitemap. Google hits /sitemap/1.xml, /sitemap/2.xml, etc.
// Reads from the shared cache populated by the sitemap index route.
//
// If the cache is empty (e.g. cold start, chunk hit before index),
// it triggers a rebuild automatically so no chunk ever returns empty.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { sitemapCache, CHUNK_SIZE, CACHE_TTL_MS } from "@/lib/sitemap-cache";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/$/, "");

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// Lazy rebuild: if the chunk route is hit before the index route has run,
// we trigger the index route internally to populate the cache.
async function ensureCachePopulated() {
  const isCacheStale = Date.now() - sitemapCache.generatedAt > CACHE_TTL_MS;
  if (sitemapCache.urls.length === 0 || isCacheStale) {
    console.log("⚠️ Sitemap cache empty/stale in chunk route — triggering rebuild via index");
    try {
      // Call the sitemap index endpoint internally to rebuild the cache
      await fetch(`${baseUrl}/sitemap.xml`, { cache: "no-store" });
    } catch (err) {
      console.error("❌ Failed to trigger sitemap index rebuild:", err);
    }
  }
}

function renderUrlset(urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ""}
    ${url.priority ? `<priority>${url.priority}</priority>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;
}

export async function GET(
  _request: Request,
  { params }: { params: { page: string } }
) {
  try {
    // Strip .xml extension if present: "1.xml" → 1
    const pageParam = params.page.replace(/\.xml$/, "");
    const page = parseInt(pageParam, 10);

    if (isNaN(page) || page < 1) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await ensureCachePopulated();

    const totalChunks = Math.ceil(sitemapCache.urls.length / CHUNK_SIZE);

    if (page > totalChunks) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Slice the correct chunk
    const start = (page - 1) * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    const chunkUrls = sitemapCache.urls.slice(start, end);

    console.log(`✅ Serving sitemap chunk ${page}/${totalChunks} (${chunkUrls.length} URLs)`);

    return new NextResponse(renderUrlset(chunkUrls), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("❌ Error generating sitemap chunk:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
}
