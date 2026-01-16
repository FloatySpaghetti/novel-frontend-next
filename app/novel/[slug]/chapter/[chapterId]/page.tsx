// app/chapter/[slug]/[chapterId]/page.tsx
import ChapterReaderClient from "@/components/pages/ChapterReaderPage";
import { Metadata } from "next";
import { cache } from 'react';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Cached function to get novel data with ALL chapters (replaces separate chapters API call)
const getCachedNovelData = cache(async (novelId: string) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/novels/${encodeURIComponent(novelId)}?short_query=true`, // No limit = get all chapters
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch novel");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching novel:", error);
    return null;
  }
});

// Cached function to get specific chapter content
const getCachedChapterData = cache(async (novelId: string, chapterId: string) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/chapters/novel/${encodeURIComponent(novelId)}/${chapterId}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        }
      }
    );

    if (!response.ok) {
      console.error("Chapter fetch failed:", response.status, response.statusText);
      throw new Error("Failed to fetch chapter");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}): Promise<Metadata> {
  try {
    const { slug, chapterId } = await params;
    const novelId = slug.replace(/-/g, " ");

    // Use cached functions - these will be reused by the page component!
    const [novelResponse, chapterResponse] = await Promise.all([
      getCachedNovelData(novelId),
      getCachedChapterData(novelId, chapterId),
    ]);

    const selectedNovel = novelResponse?.data;
    const selectedChapter = chapterResponse?.data;

    if (!selectedNovel || !selectedChapter) {
      return {
        title: "Chapter Not Found | Novel Tavern",
        description: "The requested chapter could not be found.",
      };
    }

    const chapterNumber = selectedChapter.chapter_number;
    const novelTitle = selectedNovel.title;
    const chapterTitle = selectedChapter.title || "Untitled Chapter";

    // Optimized content processing
    const rawContent = selectedChapter.content_text
      ?.split(/\n+/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join(" ") || "";

    const truncatedContent = rawContent.length > 160 
      ? `${rawContent.slice(0, 157).trim()}...` 
      : rawContent;

    const title = `${novelTitle} [Chapter - ${chapterNumber}] : ${chapterTitle}. read listen ${novelTitle} - ${chapterNumber} : ${chapterTitle} novel audiobook full online for free, NovelTavern.`;
    const description = `Read, listen to ${novelTitle} - ${chapterNumber} : ${chapterTitle} novel audio update online for free. ${truncatedContent}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: selectedNovel.cover_image_url ? [{
          url: selectedNovel.cover_image_url,
          width: 400,
          height: 600,
          alt: `${novelTitle} Chapter ${chapterNumber}`,
        }] : [],
        type: "article",
        siteName: "Novel Tavern",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: selectedNovel.cover_image_url ? [selectedNovel.cover_image_url] : [],
      },
      other: {
        "application/ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Chapter",
          name: `Chapter ${chapterNumber}: ${chapterTitle}`,
          position: chapterNumber,
          isPartOf: {
            "@type": "Book",
            name: novelTitle,
            author: selectedNovel.author?.name ? {
              "@type": "Person",
              name: selectedNovel.author.name,
            } : undefined,
            publisher: selectedNovel.publisher ? {
              "@type": "Organization",
              name: selectedNovel.publisher,
            } : undefined,
            image: selectedNovel.cover_image_url,
          },
          datePublished: selectedChapter.created_at,
          description: rawContent.length > 200 ? `${rawContent.slice(0, 197).trim()}...` : rawContent,
        }),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Chapter | Novel Tavern",
      description: "Read amazing novel chapters on Novel Tavern.",
    };
  }
}

export default async function ChapterReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}) {
  try {
    const { slug, chapterId } = await params;
    const novelId = slug?.replace(/-/g, " ");

    // Reuse cached data from metadata generation!
    const [novelResponse, chapterResponse] = await Promise.all([
      getCachedNovelData(novelId),    // This is cached - no duplicate API call!
      getCachedChapterData(novelId, chapterId), // This is cached - no duplicate API call!
    ]);

    const selectedNovel = novelResponse?.data;
    const selectedChapter = chapterResponse?.data;

    // Get chapters from novel API (no separate chapters API call needed!)
    const chapters = novelResponse?.data?.chapters || [];

    if (!selectedNovel || !selectedChapter) {
      return (
        <div className="pt-20 min-h-screen container mx-auto px-4">
          <Head>
            {/* Popunder Script */}
            <script 
              src="https://thinnerwithdrewforbear.com/00/9d/5b/009d5b42cf6419324538bfb7a531b9d8.js" 
              async 
            />
          </Head>
          <div className="text-center py-12">
            <h2 className="text-2xl font-serif font-bold text-primary-900 mb-4">
              Chapter Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The chapter you are looking for does not exist or has been removed.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Debug: Novel ID: {novelId}, Chapter ID: {chapterId}
            </p>
          </div>
        </div>
      );
    }

    // Optimized structured data (no duplication)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Chapter",
      name: `Chapter ${selectedChapter.chapter_number}: ${selectedChapter.title}`,
      position: selectedChapter.chapter_number,
      isPartOf: {
        "@type": "Book",
        name: selectedNovel.title,
        author: selectedNovel.author?.name ? {
          "@type": "Person",
          name: selectedNovel.author.name,
        } : undefined,
        publisher: selectedNovel.publisher ? {
          "@type": "Organization",
          name: selectedNovel.publisher,
        } : undefined,
        image: selectedNovel.cover_image_url,
      },
      datePublished: selectedChapter.created_at,
      description: selectedChapter.content_text
        ?.split(/\n+/)
        .filter((line: string) => line.trim() !== "")
        .slice(0, 2)
        .join(" ")
        .slice(0, 200),
    };

    return (
      <>
        <Head>
          {/* Popunder Script */}
          <script 
            src="https://thinnerwithdrewforbear.com/00/9d/5b/009d5b42cf6419324538bfb7a531b9d8.js" 
            async 
          />
        </Head>

        {/* Inject Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        <ChapterReaderClient
          selectedNovel={selectedNovel}
          chapters={chapters}
          selectedChapter={selectedChapter}
          novelId={novelId}
          chapterId={chapterId}
          slug={slug}
        />
      </>
    );
  } catch (error) {
    console.error("Error in ChapterReaderPage:", error);
    return (
      <div className="pt-20 min-h-screen container mx-auto px-4">
        <Head>
          {/* Popunder Script even on error fallback */}
          <script 
            src="https://thinnerwithdrewforbear.com/00/9d/5b/009d5b42cf6419324538bfb7a531b9d8.js" 
            async 
          />
        </Head>
        <div className="text-center py-12">
          <h2 className="text-2xl font-serif font-bold text-primary-900 mb-4">
            Error Loading Chapter
          </h2>
          <p className="text-gray-600">
            Something went wrong while loading this chapter. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
