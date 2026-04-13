// lib/utils.ts
// Single source of truth for URL slug generation.
// Import createSlug from here in ALL files:
//   - components that generate /novel/[slug] links
//   - app/sitemap.xml/route.ts
//   - app/sitemap/[page]/route.ts

/**
 * Creates a URL-friendly slug from a title.
 * - Converts to lowercase
 * - Removes ALL special characters (semicolons, commas, quotes, etc.)
 * - Replaces spaces with hyphens
 * - Collapses multiple hyphens into one
 */
export const createSlug = (title: string): string => {
  if (!title || typeof title !== 'string') {
    return 'untitled-novel';
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove everything except letters, numbers, spaces
    .trim()
    .replace(/\s+/g, '-')        // Spaces → hyphens
    .replace(/-+/g, '-')         // Collapse multiple hyphens
    .replace(/(^-|-$)/g, '');    // Remove leading/trailing hyphens

  return slug || 'untitled-novel';
};

// Keep slugify as an alias so sitemap routes can import either name
export const slugify = createSlug;

// Examples:
// "Affinity; Chaos"                → "affinity-chaos"         ✅
// "999 kinds, various ways"        → "999-kinds-various-ways"  ✅
// "SUPREME HAREM GOD SYSTEM"       → "supreme-harem-god-system"✅
// "Hero Of Darkness"               → "hero-of-darkness"        ✅
// "The Black-Winged Demon"         → "the-black-winged-demon"  ✅
