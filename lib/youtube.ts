import { YoutubeTranscript } from 'youtube-transcript';

export interface VideoMetadata {
  videoId: string;
  title: string;
  channelId: string;
  channelName: string;
  publishedAt: Date;
  url: string;
  duration?: number;
}

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface VideoWithTranscript extends VideoMetadata {
  transcript: string;
  transcriptSegments: TranscriptSegment[];
}

/**
 * Fetch transcript for a single YouTube video
 */
export async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((segment) => segment.text).join(' ');
  } catch (error) {
    console.error(`Failed to fetch transcript for video ${videoId}:`, error);
    throw new Error(`Could not fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch transcript with segments for a single YouTube video
 */
export async function fetchTranscriptWithSegments(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((segment) => ({
      text: segment.text,
      offset: segment.offset,
      duration: segment.duration,
    }));
  } catch (error) {
    console.error(`Failed to fetch transcript for video ${videoId}:`, error);
    throw new Error(`Could not fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get channel videos using YouTube RSS feed (no API key needed)
 * This is a simple approach that works for recent videos
 */
export async function getChannelVideos(
  channelHandleOrId: string,
  daysBack: number = 90,
  providedChannelId?: string
): Promise<VideoMetadata[]> {
  try {
    let channelId: string;
    let channelName: string;

    // If channelId is provided, use it directly
    if (providedChannelId) {
      channelId = providedChannelId;
      channelName = channelHandleOrId;
    } else {
      // First, we need to get the channel ID from the handle
      // We'll use a simple fetch to the channel page and parse
      const handleUrl = `https://www.youtube.com/${channelHandleOrId}`;
      const response = await fetch(handleUrl);
      const html = await response.text();

      // Extract channel ID from the page - try multiple patterns
      const channelIdMatch = html.match(/"channelId":"([^"]+)"/) ||
                           html.match(/channel_id=([^"&]+)/);
      const channelNameMatch = html.match(/"author":"([^"]+)"/);

      if (!channelIdMatch) {
        throw new Error(`Could not find channel ID for handle: ${channelHandleOrId}`);
      }

      channelId = channelIdMatch[1];
      channelName = channelNameMatch ? channelNameMatch[1] : channelHandleOrId;
    }

    // Fetch RSS feed
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssResponse = await fetch(rssUrl);
    const rssText = await rssResponse.text();

    // Parse RSS feed (simple XML parsing)
    const videos: VideoMetadata[] = [];
    const videoRegex = /<entry>[\s\S]*?<yt:videoId>(.*?)<\/yt:videoId>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<published>(.*?)<\/published>[\s\S]*?<\/entry>/g;

    let match;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    while ((match = videoRegex.exec(rssText)) !== null) {
      const videoId = match[1];
      const title = match[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const publishedAt = new Date(match[3]);

      // Only include videos within the date range
      if (publishedAt >= cutoffDate) {
        videos.push({
          videoId,
          title,
          channelId,
          channelName,
          publishedAt,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }
    }

    return videos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  } catch (error) {
    console.error(`Failed to fetch videos for channel ${channelHandle}:`, error);
    throw new Error(`Could not fetch channel videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch video with transcript
 */
export async function fetchVideoWithTranscript(video: VideoMetadata): Promise<VideoWithTranscript> {
  const transcriptSegments = await fetchTranscriptWithSegments(video.videoId);
  const transcript = transcriptSegments.map((seg) => seg.text).join(' ');

  return {
    ...video,
    transcript,
    transcriptSegments,
  };
}
