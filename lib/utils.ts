// lib/utils.ts
// Single source of truth for URL slug generation.
// Used by: components, sitemap routes, and anywhere a novel URL is built.

/**
 * Creates a URL-friendly slug from a novel title.
 *
 * Step 1: Lowercase everything
 * Step 2: Remove apostrophes silently (it's → its, don't → dont)
 * Step 3: Convert word-separating symbols (- . _ ; , | ! ? etc.) to spaces
 *         so "Black-Winged" → "black winged" → "black-winged" (not "blackwinged")
 * Step 4: Strip any remaining non-alphanumeric characters
 * Step 5: Collapse whitespace to single hyphens
 * Step 6: Clean up leading/trailing hyphens
 */
export const createSlug = (title: string): string => {
  if (!title || typeof title !== 'string') {
    return 'untitled-novel';
  }

  const slug = title
    .toLowerCase()
    // Step 2: Remove apostrophes silently so contractions stay joined
    // it's → its | don't → dont | heaven's → heavens
    .replace(/[''`]/g, '')
    // Step 3: Convert word-separating symbols to spaces BEFORE stripping
    // Prevents "Black-Winged" → "blackwinged" and "Hero.Of" → "heroof"
    .replace(/[-_.;,|!?"\\\/+=#@&%^*~()[\]{}]/g, ' ')
    // Step 4: Remove anything else that's not a letter, number, or space
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')    // spaces → hyphens
    .replace(/-+/g, '-')     // collapse multiple hyphens
    .replace(/(^-|-$)/g, ''); // trim leading/trailing hyphens

  return slug || 'untitled-novel';
};

// Alias — sitemap routes import this name
export const slugify = createSlug;

// Examples:
// "It's a Test Novel"                        → "its-a-test-novel"
// "Heaven's Devourer"                        → "heavens-devourer"
// "Affinity; Chaos"                          → "affinity-chaos"
// "The Black-Winged Demon"                   → "the-black-winged-demon"
// "SSS-level Talent at the Beginning"        → "sss-level-talent-at-the-beginning"
// "Hero.Of.Darkness"                         → "hero-of-darkness"
// "999 kinds, various ways to beat"          → "999-kinds-various-ways-to-beat"
// "SUPREME HAREM GOD SYSTEM"                 → "supreme-harem-god-system"
