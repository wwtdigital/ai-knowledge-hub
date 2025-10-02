#!/usr/bin/env node

/**
 * Test script to verify transcript fetching works
 * Usage: node scripts/test-transcript.js VIDEO_ID
 */

import { YoutubeTranscript } from 'youtube-transcript';

const videoId = process.argv[2] || 'dQw4w9WgXcQ'; // Default to a test video

console.log(`Testing transcript fetch for video: ${videoId}`);
console.log(`URL: https://www.youtube.com/watch?v=${videoId}\n`);

try {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  const fullText = transcript.map(seg => seg.text).join(' ');

  console.log('✅ Transcript fetched successfully!');
  console.log(`Length: ${fullText.length} characters`);
  console.log(`Segments: ${transcript.length}`);
  console.log(`\nFirst 500 characters:`);
  console.log(fullText.substring(0, 500) + '...\n');
} catch (error) {
  console.error('❌ Failed to fetch transcript:');
  console.error(error.message);
  process.exit(1);
}
