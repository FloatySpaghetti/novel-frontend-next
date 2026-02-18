// components/ads/SocialBarLoader.tsx
'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SocialBarLoader() {
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Ensure this runs only client-side
    if (typeof window !== 'undefined' && pathname) {
      const isChapterPage = /^\/novel\/[^/]+\/chapter\/[^/]+$/.test(pathname);
      console.log(`[SocialBarLoader] Current path: ${pathname}`);
      console.log(`[SocialBarLoader] Is chapter page? ${isChapterPage}`);

      if (isChapterPage) {
        setShouldRender(true);
      } else {
        setShouldRender(false);
      }
    }
  }, [pathname]);

  if (!shouldRender) return null;

  return (
    <Script
      id="socialbar-script"
      src="https://degreeeruptionpredator.com/27/d7/28/27d72879876998e556c48fcae6fb7203.js"
      strategy="afterInteractive"
      onError={(e) => {
        console.error('[SocialBarLoader] Script failed to load:', e);
      }}
    />
  );
}
