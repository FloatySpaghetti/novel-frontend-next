// proxy.ts — place at project ROOT (same level as package.json)
// Next.js 16+ renamed "middleware.ts" to "proxy.ts"
// Delete your old middleware.ts after adding this file.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function cleanPathname(pathname: string): string {
  return pathname
    .toLowerCase()                      // fix uppercase slugs
    .replace(/[^a-z0-9\-\/\.]/g, "")   // remove special chars (keep / - .)
    .replace(/-+/g, "-")               // collapse multiple hyphens
    .replace(/\/-/g, "/")              // remove leading hyphens after slashes
    .replace(/-\//g, "/");             // remove trailing hyphens before slashes
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cleaned = cleanPathname(pathname);

  if (pathname !== cleaned) {
    const url = request.nextUrl.clone();
    url.pathname = cleaned;
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/novel/:path*', '/sitemap/:path*'],
};
