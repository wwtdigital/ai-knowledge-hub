import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (for basic protection)
// For production, use Redis or Vercel KV
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  limit.count++;
  return true;
}

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes only
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Skip rate limiting for cron jobs (they have their own auth)
    if (request.nextUrl.pathname.startsWith('/api/cron/')) {
      return NextResponse.next();
    }

    const key = getRateLimitKey(request);
    const allowed = checkRateLimit(key);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Maximum ${MAX_REQUESTS} requests per minute allowed`,
        },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
