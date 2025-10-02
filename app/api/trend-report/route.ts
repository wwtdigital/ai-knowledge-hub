import { NextRequest, NextResponse } from 'next/server';
import { generateTrendReport } from '@/lib/ai-analysis';

export const maxDuration = 60;

/**
 * API endpoint to generate a trend report from recent transcripts
 * POST /api/trend-report
 * Body: { transcripts: Array<{ title: string, transcript: string, date: string }> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcripts } = body;

    if (!transcripts || !Array.isArray(transcripts)) {
      return NextResponse.json(
        { error: 'Missing or invalid transcripts array' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const processedTranscripts = transcripts.map((t) => ({
      title: t.title,
      transcript: t.transcript,
      date: new Date(t.date),
    }));

    const report = await generateTrendReport(processedTranscripts);

    return NextResponse.json({
      success: true,
      report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Trend report generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
