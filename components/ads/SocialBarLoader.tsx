// components/ads/SocialBarLoader.tsx
'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SocialBarLoader() {
  const pathname = usePathname();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const isChapterPage = pathname && /^\/novel\/.+\/chapter\/.+$/.test(pathname);
    console.log('Current Path:', pathname);
    console.log('Is Chapter Page?', isChapterPage);

    if (isChapterPage) {
      setShouldLoad(true);
    }
  }, [pathname]);

  if (!shouldLoad) {
    return null;
  }

  console.log('Rendering SocialBar script');

  return (
    <Script
      src="https://degreeeruptionpredator.com/27/d7/28/27d72879876998e556c48fcae6fb7203.js"
      strategy="afterInteractive"
      onError={(e) => {
        console.warn('SocialBar script failed to load:', e);
      }}
    />
  );
}
