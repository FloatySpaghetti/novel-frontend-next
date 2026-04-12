// app/sitemap.xml/route.ts
// Sitemap INDEX — counts total URLs and lists chunk sitemaps.
// Does NOT need to fetch all chapters, just needs the total count.

import { NextResponse } from "next/server";
import { CHUNK_SIZE } from "@/lib/sitemap-cache";

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

async function buildAllUrls() {
  const staticPaths = [
    "browse", "genres", "contact", "terms",
    "privacy", "search", "signin", "signup", "profile",
  ];

  const urls = [
    { loc: `${baseUrl}/`, lastmod: new Date().toISOString(), changefreq: "daily", priority: "1.0" },
    ...staticPaths.map((path) => ({
      loc: `${baseUrl}/${path}`,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  const novels = await getNovels();
  console.log(`✅ Fetched ${novels.length} novels for sitemap index`);

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

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const urls = await buildAllUrls();
    const totalChunks = Math.ceil(urls.length / CHUNK_SIZE);
    const now = new Date().toISOString();

    console.log(`✅ Sitemap index: ${urls.length} total URLs → ${totalChunks} chunks`);

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: totalChunks }, (_, i) => `  <sitemap>
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
