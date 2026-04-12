import NovelDetailClient from "@/components/pages/NovelDetailPage";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Cache the API call to avoid duplicate requests
const getCachedNovelData = cache(async (novelId: string) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/novels/${encodeURIComponent(novelId)}?short_query=true&limit=10`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch novel: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching novel:", error);
    return null;
  }
});

// Your actual component interfaces
interface Author {
  id?: string;
  name: string;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  created_at: string;
}

interface Novel {
  id: string;
  title: string;
  synopsis: string;
  cover_image_url: string;
  author_id?: string;
  author: Author;
  status: string;
  publisher: string;
  publishing_year?: string;
  genres?: Genre[];
}

interface APINovelStats {
  average_rating: number;
  rating_count: number;
}

// API response interfaces
interface ApiNovelData {
  id: number; // API returns number
  title: string;
  author?: { id?: number; name: string };
  publisher?: string;
  cover_image_url?: string;
  synopsis?: string;
  status?: string;
  publishing_year?: number;
  genres?: { id: number; name: string; slug: string }[];
  chapters?: any[];
  totalChapters?: number;
  latestChapter?: any;
  author_id?: number;
}

interface ApiResponse {
  data: ApiNovelData;
  stats: APINovelStats;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const novelId = slug.replace(/-/g, " ");

    // Use cached function - no duplicate API call!
    const response: ApiResponse | null = await getCachedNovelData(novelId);
    const novel = response?.data;

    if (!novel) {
      return {
        title: "Novel Not Found | Novel Tavern",
        description: "The requested novel could not be found.",
        robots: { index: false, follow: false },
      };
    }

    // Optimized metadata generation
    const title = `${novel.title} novel, read listen ${novel.title} online for free - NovelTavern`;
    
    const rawSynopsis = novel.synopsis || "No description available";
    const synopsis = rawSynopsis.length > 160 
      ? `${rawSynopsis.slice(0, 157).trim()}...` 
      : rawSynopsis.trim();

    const authorName = novel.author?.name || "Unknown Author";
    const description = `Read and listen to ${novel.title} novel full audiobook by ${authorName} released on ${novel.publishing_year || "Unknown Year"} which is still ${novel.status || "unknown status"} and telling a story about ${synopsis}`;

    return {
      title,
      description,
      keywords: [
        novel.title,
        "novel",
        "read online",
        ...(novel.genres?.map(g => g.name) || []),
        authorName,
      ].filter(Boolean).join(", "),
      authors: [{ name: authorName }],
      publisher: novel.publisher || "Novel Tavern",
      openGraph: {
        title,
        description,
        images: novel.cover_image_url ? [{
          url: novel.cover_image_url,
          width: 400,
          height: 600,
          alt: `Cover of ${novel.title}`,
        }] : [],
        type: "book",
        siteName: "Novel Tavern",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: novel.cover_image_url ? [novel.cover_image_url] : [],
        creator: "@noveltavern",
      },
      alternates: {
        canonical: `https://noveltavern.com/novel/${slug}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Novel | Novel Tavern",
      description: "Read amazing novels on Novel Tavern.",
    };
  }
}

export default async function NovelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const novelId = slug.replace(/-/g, " ");

    // Single API call - reuses cached data from metadata generation!
    const response: ApiResponse | null = await getCachedNovelData(novelId);

    if (!response?.data) {
      notFound();
    }

    // Direct destructuring - much cleaner and faster
    const { data: novelData, stats } = response;
    
    // Transform API data to match component expectations
    const novel: Novel = {
      id: novelData.id.toString(),
      title: novelData.title,
      synopsis: novelData.synopsis || "No description available",
      cover_image_url: novelData.cover_image_url || "", // Required field with fallback
      author_id: novelData.author_id?.toString(),
      author: {
        id: novelData.author?.id?.toString(),
        name: novelData.author?.name || "Unknown Author"
      },
      status: novelData.status || "unknown",
      publisher: novelData.publisher || "Unknown Publisher",
      publishing_year: novelData.publishing_year?.toString(),
      genres: novelData.genres?.map(genre => ({
        id: genre.id.toString(), // Convert number to string
        name: genre.name,
        slug: genre.slug
      }))
    };

    const chapters: Chapter[] = (novelData.chapters || []).map(chapter => ({
      id: chapter.id.toString(),
      chapter_number: chapter.chapter_number,
      title: chapter.title,
      created_at: chapter.created_at
    }));

    const totalChapters = novelData.totalChapters || 0;
    
    const latestChapter: Chapter = novelData.latestChapter ? {
      id: novelData.latestChapter.id.toString(),
      chapter_number: novelData.latestChapter.chapter_number,
      title: novelData.latestChapter.title,
      created_at: novelData.latestChapter.created_at
    } : {
      id: "0",
      chapter_number: 0,
      title: "No chapters available",
      created_at: new Date().toISOString()
    };

    // Optimized structured data generation
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Book",
      "@id": `https://noveltavern.com/novel/${slug}`,
      name: novel.title,
      author: novel.author.name ? {
        "@type": "Person",
        name: novel.author.name,
      } : undefined,
      datePublished: novel.publishing_year,
      publisher: novel.publisher ? {
        "@type": "Organization",
        name: novel.publisher,
      } : undefined,
      image: novel.cover_image_url || undefined,
      aggregateRating: stats.rating_count > 0 ? {
        "@type": "AggregateRating",
        ratingValue: parseFloat(stats.average_rating.toString()).toFixed(1),
        ratingCount: stats.rating_count,
        bestRating: "5",
        worstRating: "1",
      } : undefined,
      description: novel.synopsis.slice(0, 200),
      genre: novel.genres?.map(g => g.name) || [],
      numberOfPages: chapters.length,
      bookFormat: "EBook",
      inLanguage: "en",
      url: `https://noveltavern.com/novel/${slug}`,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <NovelDetailClient
          initialNovel={novel}
          totalChapters={totalChapters}
          initialChapters={chapters}
          latestChapter={latestChapter}
          initialStats={stats}
          novelId={novelId}
          slug={slug}
        />
      </>
    );
  } catch (error) {
    console.error("Error in NovelDetailPage:", error);
    notFound();
  }
}