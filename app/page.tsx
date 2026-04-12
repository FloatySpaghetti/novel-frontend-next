import HomePage from "@/components/pages/HomePage";
import React from "react";
import { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const metadata: Metadata = {
  title: "NovelTavern - Read & Listen to Novels Online for Free",
  description: "Discover thousands of novels and audiobooks to read and listen online for free. Enjoy romance, fantasy, cultivation, translated novels & more on NovelTavern.",
  alternates: {
    canonical: "https://noveltavern.com",
  },
  openGraph: {
    title: "NovelTavern - Read & Listen to Novels Online for Free",
    description: "Discover thousands of novels and audiobooks to read and listen online for free. Enjoy romance, fantasy, cultivation, translated novels & more on NovelTavern.",
    url: "https://noveltavern.com",
    siteName: "NovelTavern",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NovelTavern - Read & Listen to Novels Online for Free",
    description: "Discover thousands of novels and audiobooks to read and listen online for free.",
  },
};

async function getNovels() {
  try {
    const response = await fetch(`${API_BASE}/api/novels`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch novels");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching novels:", error);
    return [];
  }
}

async function getRecentChapters() {
  try {
    const response = await fetch(
      `${API_BASE}/api/chapters/recent`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "force-cache",
        next: { revalidate: 900 },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recent chapters");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching recent chapters:", error);
    return [];
  }
}

const page = async () => {
  const [initialNovels, initialRecentChapters] = await Promise.all([
    getNovels(),
    getRecentChapters(),
  ]);

  return (
    <div>
      <HomePage
        initialNovels={initialNovels}
        initialRecentChapters={initialRecentChapters}
      />
    </div>
  );
};

export default page;
