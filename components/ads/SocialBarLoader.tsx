// components/ads/SocialBarLoader.tsx
'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SocialBarLoader() {
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname) {
      const isChapterPage = /^\/novel\/[^/]+\/chapter\/[^/]+$/.test(pathname);
      if (isChapterPage) {
        setShouldRender(true);
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
        console.error('SocialBar script failed to load:', e);
      }}
    />
  );
}
