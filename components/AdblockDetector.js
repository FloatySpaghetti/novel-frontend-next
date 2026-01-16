// components/AdblockDetector.js
"use client";

import { useEffect } from "react";
import { useAdblockDetection } from "@/hooks/useAdblockDetection";

const AdblockDetector = () => {
  const { isAdblockDetected } = useAdblockDetection();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isAdblockDetected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAdblockDetected]);

  // Prevent ESC key from closing modal
  useEffect(() => {
    if (!isAdblockDetected) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isAdblockDetected]);

  if (!isAdblockDetected) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center"
      // Prevent closing by clicking outside
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-md mx-4 relative">
        <h2 className="text-xl font-bold text-red-600 mb-2">Adblock Detected!</h2>
        <p className="text-gray-700 mb-3">
          Please disable your ad blocker or whitelist our site to continue.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Ads help us keep this service free for everyone.
        </p>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Check Again (After Disabling Adblock)
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p className="font-medium mb-1">How to whitelist:</p>
          <p>1. Click your adblocker icon</p>
          <p>2. Select &quot;Disable on this site&quot; or &quot;Allow&quot;</p>
          <p>3. Click &quot;Check Again&quot; above</p>
        </div>
      </div>
    </div>
  );
};

export default AdblockDetector;
