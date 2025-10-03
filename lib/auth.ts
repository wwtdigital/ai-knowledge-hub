import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify API authentication
 * Supports both API key (for internal services) and cron secret
 */
export function verifyAuth(request: NextRequest, requireCronSecret = false): NextResponse | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Invalid authorization format. Use: Bearer <token>' }, { status: 401 });
  }

  // Check cron secret (for cron jobs)
  if (requireCronSecret) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Invalid cron secret' }, { status: 401 });
    }

    return null; // Auth successful
  }

  // Check API key (for API endpoints)
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY environment variable is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (token !== apiKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  return null; // Auth successful
}

/**
 * Verify request origin (for additional security)
 */
export function verifyOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Allow requests from same origin or Vercel cron
  const cronHeader = request.headers.get('x-vercel-cron-signature');

  if (cronHeader) {
    // Request is from Vercel Cron, allow it
    return null;
  }

  // For local development and same-origin requests
  if (!origin || origin.includes(host || '')) {
    return null;
  }

  // Could add CORS allowlist here if needed
  return null;
}
