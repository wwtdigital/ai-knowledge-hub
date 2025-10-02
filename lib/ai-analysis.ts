import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

// Create Anthropic provider that will use AI Gateway when AI_GATEWAY_API_KEY is set
const anthropic = createAnthropic({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export interface TranscriptAnalysis {
  summary: string;
  keyTopics: string[];
  mainInsights: string[];
  industryTrends?: string[];
}

/**
 * Analyze a video transcript using Claude via Vercel AI Gateway
 */
export async function analyzeTranscript(
  transcript: string,
  videoTitle: string
): Promise<TranscriptAnalysis> {
  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error('AI_GATEWAY_API_KEY environment variable is not set');
    }

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `Analyze this AI industry video transcript and provide:
1. A concise summary (2-3 sentences)
2. Key topics discussed (3-5 topics)
3. Main insights and takeaways (3-5 points)
4. Industry trends mentioned (if any)

Video Title: ${videoTitle}

Transcript:
${transcript}

Please format your response as JSON with the following structure:
{
  "summary": "...",
  "keyTopics": ["topic1", "topic2", ...],
  "mainInsights": ["insight1", "insight2", ...],
  "industryTrends": ["trend1", "trend2", ...]
}`,
    });

    // Parse the JSON response
    const cleanedText = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const analysis = JSON.parse(cleanedText);

    return analysis;
  } catch (error) {
    console.error('Failed to analyze transcript:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a trend report from multiple transcripts using Claude via Vercel AI Gateway
 */
export async function generateTrendReport(
  transcripts: Array<{ title: string; transcript: string; date: Date }>
): Promise<string> {
  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error('AI_GATEWAY_API_KEY environment variable is not set');
    }

    // Prepare context with recent transcripts
    const context = transcripts
      .map(
        (t, i) =>
          `Video ${i + 1} (${t.date.toLocaleDateString()}): ${t.title}\n${t.transcript.substring(0, 1000)}...`
      )
      .join('\n\n---\n\n');

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: `Based on these recent AI industry video transcripts, generate a comprehensive trend report that identifies:

1. **Emerging Trends**: What new developments or themes are appearing
2. **Recurring Topics**: What subjects are being discussed consistently
3. **Key Players & Companies**: Which organizations are being mentioned frequently
4. **Technology Shifts**: Any notable changes in tools, platforms, or approaches
5. **Industry Sentiment**: Overall tone and direction of the AI industry

Recent transcripts:
${context}

Please provide a well-structured markdown report that would be valuable for a team tracking AI industry developments.`,
    });

    return text;
  } catch (error) {
    console.error('Failed to generate trend report:', error);
    throw new Error(`Trend report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
