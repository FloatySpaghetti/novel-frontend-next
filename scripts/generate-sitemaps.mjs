// scripts/generate-sitemaps.mjs
// Generates static sitemap XML files into /public at build time.
// Run via: node scripts/generate-sitemaps.mjs
// Automatically called by "npm run build" via package.json.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// ── Load .env file manually (Node scripts don't get Next.js env auto-loading) ──
function loadEnv() {
  const envFiles = ['.env.local', '.env.production', '.env'];
  for (const filename of envFiles) {
    const envPath = path.join(ROOT_DIR, filename);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value; // don't override existing
      }
      console.log(`📄 Loaded env from ${filename}`);
      break;
    }
  }
}

loadEnv();

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://noveltavern.com').replace(/\/$/, '');
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const CHUNK_SIZE = 15000;

if (!API_BASE) {
  console.error('❌ NEXT_PUBLIC_API_URL is not set in your .env file!');
  console.error('   Make sure your .env or .env.local contains:');
  console.error('   NEXT_PUBLIC_API_URL=https://api.noveltavern.com');
  process.exit(1);
}

console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`📍 API:      ${API_BASE}`);

// ── Slugify (matches lib/utils.ts) ────────────────────────────────────────────
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

// ── API helpers ───────────────────────────────────────────────────────────────
async function getNovels() {
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

// ── XML builders ──────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🗺️  Starting sitemap generation...\n');

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

  // Fetch novels
  console.log('📚 Fetching novels...');
  const novels = await getNovels();
  console.log(`✅ Fetched ${novels.length} novels\n`);

  // Fetch chapters for each novel
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
      console.log(`  [${i + 1}/${novels.length}] ${novel.title} → ${chapters.length} chapters`);
    } catch (err) {
      console.error(`  ❌ Skipped chapters for "${novel.title}": ${err.message}`);
    }
  }

  console.log(`\n📊 Total URLs: ${urls.length}`);

  // Ensure /public exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Split into chunks and write files
  const totalChunks = Math.ceil(urls.length / CHUNK_SIZE);
  const now = new Date().toISOString();

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    const chunkUrls = urls.slice(start, end);
    const filePath = path.join(PUBLIC_DIR, `sitemap-${i + 1}.xml`);
    fs.writeFileSync(filePath, renderUrlset(chunkUrls));
    console.log(`✅ Written public/sitemap-${i + 1}.xml (${chunkUrls.length} URLs)`);
  }

  // Write sitemap index
  const indexPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  fs.writeFileSync(indexPath, renderSitemapIndex(totalChunks, now));
  console.log(`✅ Written public/sitemap.xml (index → ${totalChunks} chunks)`);

  console.log('\n🎉 Sitemap generation complete!\n');
}

main().catch(err => {
  console.error('\n❌ Sitemap generation failed:', err.message);
  process.exit(1);
});
