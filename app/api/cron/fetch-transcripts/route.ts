import { NextRequest, NextResponse } from 'next/server';
import { channels } from '@/config/channels';
import { getChannelVideos, fetchVideoWithTranscript } from '@/lib/youtube';
import { batchSaveTranscripts, updateIndex } from '@/lib/storage';
import { verifyAuth } from '@/lib/auth';

export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (fail-closed: requires secret to be set)
    const authError = verifyAuth(request, true);
    if (authError) {
      return authError;
    }

    console.log('Starting scheduled transcript fetch...');

    const results = {
      channels: [] as any[],
      totalVideos: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      totalSkipped: 0,
    };

    // Process each enabled channel
    for (const channel of channels.filter((c) => c.enabled)) {
      console.log(`Processing channel: ${channel.name} (${channel.youtubeHandle})`);

      try {
        // Fetch videos from the last 2 days (for daily cron)
        const videos = await getChannelVideos(
          channel.youtubeHandle || channel.name,
          2,
          channel.channelId
        );
        console.log(`Found ${videos.length} videos from ${channel.name}`);

        // Fetch transcripts for each video
        const videosWithTranscripts = [];
        for (const video of videos) {
          try {
            const videoWithTranscript = await fetchVideoWithTranscript(video);
            videosWithTranscripts.push(videoWithTranscript);
            console.log(`Fetched transcript for: ${video.title}`);
          } catch (error) {
            console.error(`Failed to fetch transcript for video: ${video.title}`, error);
          }

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Save as markdown files
        const batchResult = await batchSaveTranscripts(videosWithTranscripts);

        results.channels.push({
          channel: channel.name,
          videosFound: videos.length,
          ...batchResult,
        });

        results.totalVideos += videos.length;
        results.totalSuccessful += batchResult.successful;
        results.totalFailed += batchResult.failed;
        results.totalSkipped += batchResult.skipped;
      } catch (error) {
        console.error(`Error processing channel ${channel.name}:`, error);
        results.channels.push({
          channel: channel.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Scheduled transcript fetch completed', results);

    // Update the index file
    await updateIndex();
    console.log('Index file updated');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
