"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";
import AudioPlayer from "@/components/chapter/AudioPlayer";
import ChapterNavigation from "@/components/chapter/ChapterNavigation";
import ChapterSelector from "@/components/chapter/ChapterSelector";
import AdBanner from '@/components/ads/adbanner';
import SocialBar from '@/components/ads/SocialBar'; //  Add this import
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";

interface ChapterPreferences {
  theme: "light" | "dark";
  fontSize: number;
  autoPlayEnabled: boolean;
}

interface Novel {
  id: string;
  title: string;
  [key: string]: unknown;
}

interface Chapter {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content_text: string;
  audio_url: string;
  order_index: number;
  created_at: string;
  [key: string]: unknown;
}

interface ChapterReaderClientProps {
  selectedNovel: Novel;
  chapters: Chapter[];
  selectedChapter: Chapter;
  novelId: string;
  chapterId: string;
  slug: string;
}

const ChapterReaderClient: React.FC<ChapterReaderClientProps> = ({
  selectedNovel,
  chapters,
  selectedChapter,
  novelId,
  chapterId,
  slug,
}) => {
  const { userProgress } = useAppSelector((state) => state.progress);
  const { user } = useAppSelector((state) => state.auth);
  // Access global theme state from Redux
  const { isDarkMode } = useAppSelector((state) => state.theme);
  const router = useRouter();

  const loadPreferences = (): ChapterPreferences => {
    if (typeof window !== "undefined") {
      const savedPrefs = localStorage.getItem("chapterPreferences");
      if (savedPrefs) {
        try {
          return JSON.parse(savedPrefs);
        } catch (error) {
          console.error("Error parsing preferences:", error);
        }
      }
    }
    return {
      theme: "light",
      fontSize: 16,
      autoPlayEnabled: false,
    };
  };

  const [preferences, setPreferences] = useState<ChapterPreferences>(
    loadPreferences()
  );
  const [isChapterSelectorOpen, setIsChapterSelectorOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Sync local theme with global Redux theme
  useEffect(() => {
    setPreferences((prev) => ({
      ...prev,
      theme: isDarkMode ? "dark" : "light",
    }));
  }, [isDarkMode]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("chapterPreferences", JSON.stringify(preferences));
      } catch (error) {
        console.error("Error saving preferences:", error);
      }
    }
  }, [preferences]);

  // Get progress data
  const progressKey = novelId && chapterId ? `${novelId}-${chapterId}` : "";
  const savedProgress = userProgress[progressKey];
  const initialPosition = savedProgress?.audio_position || 0;

  // Find next chapter for autoplay navigation
  const findNextChapter = useCallback(() => {
    const currentIndex = chapters.findIndex(
      (chapter) => chapter.chapter_number.toString() === chapterId
    );
    
    if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
      return chapters[currentIndex + 1];
    }
    return null;
  }, [chapters, chapterId]);

  // Handle chapter end - navigate to next chapter if autoplay is enabled
  const handleChapterEnd = useCallback(() => {
    if (!preferences.autoPlayEnabled) {
      return;
    }

    const nextChapter = findNextChapter();
    if (!nextChapter) {
      return;
    }

    setIsNavigating(true);

    // Use Next.js router for better performance, fallback to window.location
    try {
      const nextUrl = `/novel/${slug}/chapter/${nextChapter.chapter_number}`;
      router.push(nextUrl);
    } catch (error) {
      console.error("Router navigation failed, using window.location:", error);
      window.location.href = `/novel/${slug}/chapter/${nextChapter.chapter_number}`;
    }
  }, [preferences.autoPlayEnabled, findNextChapter, slug, router]);

  // Reset navigation state when chapter changes
  useEffect(() => {
    setIsNavigating(false);
  }, [chapterId]);

  const increaseFontSize = () => {
    setPreferences((prev) => ({
      ...prev,
      fontSize: Math.min(prev.fontSize + 2, 24),
    }));
  };

  const decreaseFontSize = () => {
    setPreferences((prev) => ({
      ...prev,
      fontSize: Math.max(prev.fontSize - 2, 12),
    }));
  };

  const toggleAutoPlay = () => {
    setPreferences((prev) => ({
      ...prev,
      autoPlayEnabled: !prev.autoPlayEnabled,
    }));
  };

  const formatChapterContent = (content: string) => {
    const paragraphs = content
      .split(/(?:<\/p>|<br\s*\/?\>|\n)/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((p) => p.replace(/<p>|<br\s*\/?\>/g, "").trim());
    const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    return paragraphs
      .map((p) => {
        const withLinks = p.replace(
          urlPattern,
          (url) =>
            `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700 underline">${url}</a>`
        );
        return `<p class="mb-6">${withLinks}</p>`;
      })
      .join("\n\n");
  };

  // Validate audio URL
  const isValidAudioUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a');
    } catch {
      return false;
    }
  };

  // Get clean audio URL
  const audioUrl = selectedChapter?.audio_url;
  const hasValidAudio = isValidAudioUrl(audioUrl);

  return (
    <div
      className={`pt-16 min-h-screen ${
        preferences.theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-gray-50 text-gray-800"
      }`}
    >
      {/* Navigation Loading Indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary-600 text-white p-2 text-center text-sm">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading next chapter...
          </div>
        </div>
      )}

      {/* Novel/Chapter Info Bar */}
      <div
        className={`sticky top-16 z-30 ${
          preferences.theme === "dark" ? "bg-gray-800" : "bg-white"
        } shadow-md`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <Link href={`/novel/${slug}`} className="flex items-center">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <div>
                  <h2 className="font-serif font-bold text-lg line-clamp-1">
                    {selectedNovel.title}
                  </h2>
                  <p
                    className={`text-sm ${
                      preferences.theme === "dark"
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  >
                    Chapter {selectedChapter.chapter_number}:{" "}
                    {selectedChapter.title}
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleAutoPlay}
                className={`relative p-2 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${
                  preferences.autoPlayEnabled
                    ? "bg-primary-100 text-primary-600 ring-2 ring-primary-300"
                    : preferences.theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
                aria-label="Toggle auto-play"
                title={
                  preferences.autoPlayEnabled
                    ? "Auto-play enabled"
                    : "Auto-play disabled"
                }
              >
                <PlayCircle className={`w-5 h-5 ${preferences.autoPlayEnabled ? 'animate-pulse' : ''}`} />
                <span className="absolute top-8 text-[10px] sm:block hidden leading-none">
                  AutoPlay
                </span>
                {preferences.autoPlayEnabled && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </button>

              <button
                onClick={decreaseFontSize}
                className={`p-2 rounded-full ${
                  preferences.theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
                aria-label="Decrease font size"
              >
                <span className="font-medium">A-</span>
              </button>
              <button
                onClick={increaseFontSize}
                className={`p-2 rounded-full ${
                  preferences.theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
                aria-label="Increase font size"
              >
                <span className="font-medium">A+</span>
              </button>
              <button
                onClick={() => setIsChapterSelectorOpen(true)}
                className={`p-2 rounded-full ${
                  preferences.theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
                aria-label="Chapter list"
              >
                <BookOpen className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chapter Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Audio Player Section */}
          <div className="mb-6">
            {hasValidAudio ? (
              <AudioPlayer
                audioUrl={audioUrl}
                initialPosition={initialPosition}
                novelId={novelId}
                chapterId={chapterId}
                userId={user?.id}
                autoPlay={preferences.autoPlayEnabled}
                onEnded={handleChapterEnd}
              />
            ) : (
              <div className={`p-4 rounded-lg text-center ${
                preferences.theme === "dark" 
                  ? "bg-gray-800 text-gray-400" 
                  : "bg-gray-50 text-gray-700"
              }`}>
                <p className="text-sm">Audio not available for this chapter</p>
              </div>
            )}
          </div>

          {/* Audio troubleshooting note - only show if audio should be available */}
          {hasValidAudio && (
            <div className={`mb-4 p-4 rounded-lg ${
              preferences.theme === "dark"
                ? "bg-yellow-900/20 text-yellow-300"
                : "bg-warning-50 text-warning-800"
            }`}>
              <p className="text-sm">
                <strong>Audio Troubleshooting:</strong> If audio isn&apos;t playing, try refreshing the page. 
                AutoPlay may be blocked by your browser - this is normal. If audio fails to start automatically, 
                you can click the play button manually.
              </p>
            </div>
          )}

          {/* Chapter Navigation */}
          <div className="mb-6">
            <ChapterNavigation
              chapters={chapters}
              currentChapterId={chapterId || ""}
              novelSlug={slug || ""}
              onListClick={() => setIsChapterSelectorOpen(true)}
            />
          </div>

          {/* Ad Slot 1 - Centered */}
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-center">
              <AdBanner /> {/* Remove loadDelay prop */}
            </div>
          </div>

          {/* Chapter Text Content */}
          <div
            className={`prose max-w-none ${
              preferences.theme === "dark" ? "prose-invert" : ""
            }`}
            style={{ fontSize: `${preferences.fontSize}px` }}
            dangerouslySetInnerHTML={{
              __html: formatChapterContent(selectedChapter.content_text),
            }}
          />

          {/* Ad Slot 2 - Before Bottom Navigation */}
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-center">
              <AdBanner />
            </div>
          </div>

          {/* Bottom Chapter Navigation */}
          <div className="mt-12">
            <ChapterNavigation
              chapters={chapters}
              currentChapterId={chapterId || ""}
              novelSlug={slug || ""}
              onListClick={() => setIsChapterSelectorOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Chapter Selector Modal */}
      <ChapterSelector
        chapters={chapters}
        currentChapterId={chapterId || ""}
        novelSlug={slug || ""}
        isOpen={isChapterSelectorOpen}
        onClose={() => setIsChapterSelectorOpen(false)}
      />
    </div>
  );
};

export default ChapterReaderClient;
