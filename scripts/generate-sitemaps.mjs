// scripts/generate-sitemaps.mjs
// Run at build time to pre-generate all sitemap files to disk.
// Add to package.json: "build": "node scripts/generate-sitemaps.mjs && next build"
//
// This generates static XML files in /public/:
//   public/sitemap.xml
//   public/sitemap-1.xml
//   public/sitemap-2.xml
//   etc.
//
// Next.js serves /public files directly — no server processing, instant response.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://noveltavern.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const CHUNK_SIZE = 15000;

function slugify(title) {
  if (!title || typeof title !== 'string') return 'untitled-novel';
  return title
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[-_.;,|!?"\\\/+=#@&%^*~()[\]{}]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '') || 'untitled-novel';
}

async function getNovels() {
  console.log('📚 Fetching novels...');
  const res = await fetch(`${API_BASE}/api/novels`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Novels fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
}

async function getChapters(novelId) {
  const res = await fetch(
    `${API_BASE}/api/chapters/novel/${encodeURIComponent(novelId)}?limit=1000000`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`Chapters fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
}

function renderUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
}

function renderSitemapIndex(totalChunks, now) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: totalChunks }, (_, i) => `  <sitemap>
    <loc>${BASE_URL}/sitemap-${i + 1}.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
}

async function main() {
  console.log('🗺️  Generating sitemaps...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 API: ${API_BASE}`);

  const staticPaths = [
    'browse', 'genres', 'contact', 'terms',
    'privacy', 'search', 'signin', 'signup', 'profile',
  ];

  const urls = [
    { loc: `${BASE_URL}/`, lastmod: new Date().toISOString(), changefreq: 'daily', priority: '1.0' },
    ...staticPaths.map(p => ({
      loc: `${BASE_URL}/${p}`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ];

  const novels = await getNovels();
  console.log(`✅ Fetched ${novels.length} novels`);

  for (let i = 0; i < novels.length; i++) {
    const novel = novels[i];
    if (!novel?.title) continue;
    const slug = slugify(novel.title);

    urls.push({
      loc: `${BASE_URL}/novel/${slug}`,
      lastmod: novel.updated_at || novel.created_at || new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.9',
    });

    try {
      const chapters = await getChapters(novel.id?.toString() || novel.title);
      for (const chapter of chapters) {
        if (!chapter?.chapter_number) continue;
        urls.push({
          loc: `${BASE_URL}/novel/${slug}/chapter/${chapter.chapter_number}`,
          lastmod: chapter.updated_at || chapter.created_at || new Date().toISOString(),
          changefreq: 'monthly',
          priority: '0.7',
        });
      }
      console.log(`  ✅ [${i + 1}/${novels.length}] ${novel.title} — ${chapters.length} chapters`);
    } catch (err) {
      console.error(`  ❌ Skipped chapters for ${novel.title}:`, err.message);
    }
  }

  console.log(`\n📊 Total URLs: ${urls.length}`);

  // Split into chunks and write to /public
  const totalChunks = Math.ceil(urls.length / CHUNK_SIZE);
  const now = new Date().toISOString();

  // Ensure public dir exists
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  // Write each chunk
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    const chunkUrls = urls.slice(start, end);
    const filename = path.join(PUBLIC_DIR, `sitemap-${i + 1}.xml`);
    fs.writeFileSync(filename, renderUrlset(chunkUrls));
    console.log(`✅ Written sitemap-${i + 1}.xml (${chunkUrls.length} URLs)`);
  }

  // Write sitemap index
  const indexPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  fs.writeFileSync(indexPath, renderSitemapIndex(totalChunks, now));
  console.log(`✅ Written sitemap.xml (index with ${totalChunks} chunks)`);
  console.log('\n🎉 Sitemap generation complete!');
}

main().catch(err => {
  console.error('❌ Sitemap generation failed:', err);
  process.exit(1);
});
