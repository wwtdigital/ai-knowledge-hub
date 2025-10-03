import { NextRequest, NextResponse } from 'next/server';
import { generateTrendReport } from '@/lib/ai-analysis';
import { verifyAuth } from '@/lib/auth';
import { validateRequest, trendReportRequestSchema } from '@/lib/validation';

export const maxDuration = 60;

/**
 * API endpoint to generate a trend report from recent transcripts
 * POST /api/trend-report
 * Body: { transcripts: Array<{ title: string, transcript: string, date: string }> }
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
    const validation = validateRequest(trendReportRequestSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const processedTranscripts = validation.data.transcripts.map((t) => ({
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
