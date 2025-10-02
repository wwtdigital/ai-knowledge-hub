import { NextRequest, NextResponse } from 'next/server';
import { analyzeTranscript } from '@/lib/ai-analysis';

export const maxDuration = 60;

/**
 * API endpoint to analyze a transcript with Claude
 * POST /api/analyze
 * Body: { transcript: string, title: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, title } = body;

    if (!transcript || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript and title' },
        { status: 400 }
      );
    }

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
