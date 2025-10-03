import { NextRequest, NextResponse } from 'next/server';
import { analyzeTranscript } from '@/lib/ai-analysis';
import { verifyAuth } from '@/lib/auth';
import { validateRequest, analyzeRequestSchema } from '@/lib/validation';

export const maxDuration = 60;

/**
 * API endpoint to analyze a transcript with Claude
 * POST /api/analyze
 * Body: { transcript: string, title: string }
 * Requires: Authorization: Bearer <API_KEY>
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authError = verifyAuth(request, false);
    if (authError) {
      return authError;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(analyzeRequestSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      );
    }

    const { transcript, title } = validation.data;
    const analysis = await analyzeTranscript(transcript, title);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
