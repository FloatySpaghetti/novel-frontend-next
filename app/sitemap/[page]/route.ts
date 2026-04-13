// app/sitemap/[page]/route.ts
// Dynamic chunk route — runs on demand, no build-time fetching.
// Each chunk fetches its own data independently.

import { NextResponse } from "next/server";
import { CHUNK_SIZE, SitemapUrl } from "@/lib/sitemap-cache";
import { slugify } from "@/lib/utils";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173").replace(/\/$/, "");

const getNovels = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/novels`, {
      cache: "no-store",
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
        cache: "no-store", // prevent 2MB cache error
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

async function buildAllUrls(): Promise<SitemapUrl[]> {
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
  console.log(`✅ Fetched ${novels.length} novels for sitemap chunk`);

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

  return urls;
}

function renderUrlset(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ""}
    ${url.priority ? `<priority>${url.priority}</priority>` : ""}
  </url>`).join("\n")}
</urlset>`;
}

export const dynamic = "force-dynamic"; // no build-time fetching
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    const { page: pageParam } = await params;
    const pageStr = pageParam.replace(/\.xml$/, "");
    const page = parseInt(pageStr, 10);

    if (isNaN(page) || page < 1) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const allUrls = await buildAllUrls();
    const totalChunks = Math.ceil(allUrls.length / CHUNK_SIZE);

    if (page > totalChunks) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const start = (page - 1) * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    const chunkUrls = allUrls.slice(start, end);

    console.log(`✅ Serving sitemap chunk ${page}/${totalChunks} (${chunkUrls.length} URLs)`);

    return new NextResponse(renderUrlset(chunkUrls), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Cloudflare-CDN-Cache-Control": "no-store",
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
