// app/sitemap/[page]/route.ts
// Statically pre-generates ALL chunk pages at build time using generateStaticParams.
// Each chunk is a separate static file — /sitemap/1.xml, /sitemap/2.xml, etc.

import { NextResponse } from "next/server";
import { CHUNK_SIZE, SitemapUrl } from "@/lib/sitemap-cache";
import { buildAllUrls } from "@/app/sitemap.xml/route";

// ── Tell Next.js which chunk pages to pre-generate at build time ───────────
export async function generateStaticParams() {
  try {
    const urls = await buildAllUrls();
    const totalChunks = Math.ceil(urls.length / CHUNK_SIZE);
    console.log(`✅ Pre-generating ${totalChunks} sitemap chunks at build time`);

    // Returns [{ page: "1" }, { page: "2" }, ...] for each chunk
    return Array.from({ length: totalChunks }, (_, i) => ({
      page: String(i + 1),
    }));
  } catch (error) {
    console.error("❌ Error in generateStaticParams for sitemaps:", error);
    return [{ page: "1" }]; // fallback: at least generate chunk 1
  }
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

// ── Static generation ──────────────────────────────────────────────────────
export const dynamic = "force-static";
export const revalidate = 3600;

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

    console.log(`✅ Generated sitemap chunk ${page}/${totalChunks} (${chunkUrls.length} URLs)`);

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
