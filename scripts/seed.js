#!/usr/bin/env node

/**
 * Seed script to fetch the last 90 days of YouTube transcripts
 * Run with: npm run seed
 */

import 'dotenv/config';
import { channels } from '../config/channels.ts';
import { getChannelVideos, fetchVideoWithTranscript } from '../lib/youtube.ts';
import { batchSaveTranscripts, updateIndex } from '../lib/storage.ts';

async function seed() {
  console.log('🌱 Starting seed process for 90-day history...\n');

  const results = {
    channels: [],
    totalVideos: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    totalSkipped: 0,
  };

  // Process each enabled channel
  for (const channel of channels.filter((c) => c.enabled)) {
    console.log(`📺 Processing channel: ${channel.name} (${channel.youtubeHandle})`);

    try {
      // Fetch videos from the last 90 days
      const videos = await getChannelVideos(
        channel.name,
        90,
        channel.channelId || undefined
      );
      console.log(`   Found ${videos.length} videos from the last 90 days\n`);

      if (videos.length === 0) {
        console.log(`   No videos found for ${channel.name}\n`);
        continue;
      }

      // Fetch transcripts for each video
      const videosWithTranscripts = [];
      let processed = 0;

      for (const video of videos) {
        try {
          processed++;
          console.log(`   [${processed}/${videos.length}] Fetching transcript for: ${video.title}`);

          const videoWithTranscript = await fetchVideoWithTranscript(video);
          videosWithTranscripts.push(videoWithTranscript);

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`   ❌ Failed to fetch transcript: ${error.message}`);
        }
      }

      console.log(`\n   ✅ Successfully fetched ${videosWithTranscripts.length} transcripts`);
      console.log(`   💾 Saving to markdown files...\n`);

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

      console.log(`   ✅ Successfully added ${batchResult.successful} videos`);
      console.log(`   ⏭️  Skipped ${batchResult.skipped} existing videos`);
      if (batchResult.failed > 0) {
        console.log(`   ❌ Failed to add ${batchResult.failed} videos`);
      }
      console.log('\n');
    } catch (error) {
      console.error(`   ❌ Error processing channel ${channel.name}: ${error.message}\n`);
      results.channels.push({
        channel: channel.name,
        error: error.message,
      });
    }
  }

  console.log('🎉 Seed process completed!\n');
  console.log('📊 Summary:');
  console.log(`   Total videos found: ${results.totalVideos}`);
  console.log(`   Successfully added: ${results.totalSuccessful}`);
  console.log(`   Skipped (existing): ${results.totalSkipped}`);
  console.log(`   Failed: ${results.totalFailed}\n`);

  console.log('📋 Channel Details:');
  results.channels.forEach((channel) => {
    console.log(`   - ${channel.channel}:`);
    if (channel.error) {
      console.log(`     Error: ${channel.error}`);
    } else {
      console.log(`     Found: ${channel.videosFound}, Added: ${channel.successful}, Skipped: ${channel.skipped}, Failed: ${channel.failed}`);
    }
  });

  // Update the index file
  console.log('\n📑 Updating index file...');
  await updateIndex();
  console.log('   ✅ Index file updated');
}

// Run the seed function
seed()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });
