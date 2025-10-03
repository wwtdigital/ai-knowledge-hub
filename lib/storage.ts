import { writeFile, readFile, mkdir, readdir } from 'fs/promises';
import { join, normalize, resolve } from 'path';
import { VideoWithTranscript } from './youtube';
import { existsSync } from 'fs';
import { sanitizeFilename } from './validation';

const TRANSCRIPTS_DIR = join(process.cwd(), 'transcripts');
const INDEX_FILE = join(process.cwd(), 'transcripts', 'INDEX.md');

/**
 * Ensure the transcripts directory exists
 */
async function ensureTranscriptsDir() {
  if (!existsSync(TRANSCRIPTS_DIR)) {
    await mkdir(TRANSCRIPTS_DIR, { recursive: true });
  }
}

/**
 * Validate file path to prevent directory traversal
 */
function validateFilePath(filePath: string): string {
  const normalizedPath = normalize(filePath);
  const resolvedPath = resolve(normalizedPath);
  const resolvedBaseDir = resolve(TRANSCRIPTS_DIR);

  // Ensure the resolved path is within the transcripts directory
  if (!resolvedPath.startsWith(resolvedBaseDir)) {
    throw new Error('Invalid file path: potential directory traversal detected');
  }

  return resolvedPath;
}

/**
 * Generate markdown filename from video metadata (sanitized)
 */
function getMarkdownFilename(video: VideoWithTranscript): string {
  const date = video.publishedAt.toISOString().split('T')[0]; // YYYY-MM-DD

  // Sanitize all parts to prevent path traversal
  const channelSlug = sanitizeFilename(video.channelName.toLowerCase());
  const titleSlug = sanitizeFilename(
    video.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
  );

  return `${date}_${channelSlug}_${titleSlug}.md`;
}

/**
 * Get the file path for a video (validated)
 */
function getVideoFilePath(video: VideoWithTranscript): string {
  const filename = getMarkdownFilename(video);
  const filePath = join(TRANSCRIPTS_DIR, filename);
  return validateFilePath(filePath);
}

/**
 * Check if a video already exists in storage
 */
export async function videoExists(videoId: string): Promise<boolean> {
  await ensureTranscriptsDir();

  try {
    const files = await readdir(TRANSCRIPTS_DIR);
    return files.some(file => file.includes(videoId));
  } catch (error) {
    return false;
  }
}

/**
 * Convert video to markdown format
 */
function videoToMarkdown(video: VideoWithTranscript): string {
  return `---
title: ${video.title}
video_id: ${video.videoId}
channel: ${video.channelName}
published_at: ${video.publishedAt.toISOString()}
url: ${video.url}
---

# ${video.title}

**Channel:** ${video.channelName}
**Published:** ${video.publishedAt.toLocaleDateString()}
**Video:** [Watch on YouTube](${video.url})

## Transcript

${video.transcript}

---

*Indexed on ${new Date().toISOString()}*
`;
}

/**
 * Save video transcript as markdown file
 */
export async function saveTranscript(video: VideoWithTranscript): Promise<string> {
  await ensureTranscriptsDir();

  // Check if already exists
  const exists = await videoExists(video.videoId);
  if (exists) {
    console.log(`Video ${video.videoId} already exists, skipping...`);
    return video.videoId;
  }

  const filePath = getVideoFilePath(video);
  const markdown = videoToMarkdown(video);

  await writeFile(filePath, markdown, 'utf-8');
  console.log(`Saved transcript: ${filePath}`);

  return filePath;
}

/**
 * Batch save transcripts
 */
export async function batchSaveTranscripts(videos: VideoWithTranscript[]): Promise<{
  successful: number;
  failed: number;
  skipped: number;
}> {
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (const video of videos) {
    try {
      const exists = await videoExists(video.videoId);
      if (exists) {
        skipped++;
        continue;
      }

      await saveTranscript(video);
      successful++;
    } catch (error) {
      console.error(`Failed to save transcript for: ${video.title}`, error);
      failed++;
    }
  }

  return { successful, failed, skipped };
}

/**
 * Update the index file with all transcripts
 */
export async function updateIndex(): Promise<void> {
  await ensureTranscriptsDir();

  const files = await readdir(TRANSCRIPTS_DIR);
  const transcriptFiles = files.filter(f => f.endsWith('.md') && f !== 'INDEX.md');

  // Read metadata from each file
  const entries = [];
  for (const file of transcriptFiles) {
    try {
      const content = await readFile(join(TRANSCRIPTS_DIR, file), 'utf-8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const title = frontmatter.match(/title: (.*)/)?.[1] || 'Unknown';
        const channel = frontmatter.match(/channel: (.*)/)?.[1] || 'Unknown';
        const publishedAt = frontmatter.match(/published_at: (.*)/)?.[1] || '';
        const url = frontmatter.match(/url: (.*)/)?.[1] || '';

        entries.push({
          file,
          title,
          channel,
          publishedAt: new Date(publishedAt),
          url,
        });
      }
    } catch (error) {
      console.error(`Failed to read file: ${file}`, error);
    }
  }

  // Sort by date (newest first)
  entries.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // Generate index markdown
  let indexContent = `# AI Knowledge Hub - Transcript Index

**Total Transcripts:** ${entries.length}
**Last Updated:** ${new Date().toLocaleString()}

---

## All Transcripts

`;

  // Group by channel
  const byChannel: { [key: string]: typeof entries } = {};
  entries.forEach(entry => {
    if (!byChannel[entry.channel]) {
      byChannel[entry.channel] = [];
    }
    byChannel[entry.channel].push(entry);
  });

  for (const [channel, channelEntries] of Object.entries(byChannel)) {
    indexContent += `\n### ${channel}\n\n`;

    for (const entry of channelEntries) {
      const date = entry.publishedAt.toLocaleDateString();
      indexContent += `- **[${entry.title}](./${entry.file})** - ${date} - [Watch](${entry.url})\n`;
    }
  }

  indexContent += `\n---\n\n*Auto-generated index file. Do not edit manually.*\n`;

  await writeFile(INDEX_FILE, indexContent, 'utf-8');
  console.log(`Updated index file: ${INDEX_FILE}`);
}

/**
 * Get all transcripts from storage
 */
export async function getAllTranscripts(): Promise<Array<{
  file: string;
  title: string;
  channel: string;
  publishedAt: Date;
  url: string;
  transcript: string;
}>> {
  await ensureTranscriptsDir();

  const files = await readdir(TRANSCRIPTS_DIR);
  const transcriptFiles = files.filter(f => f.endsWith('.md') && f !== 'INDEX.md');

  const transcripts = [];
  for (const file of transcriptFiles) {
    try {
      const content = await readFile(join(TRANSCRIPTS_DIR, file), 'utf-8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const title = frontmatter.match(/title: (.*)/)?.[1] || 'Unknown';
        const channel = frontmatter.match(/channel: (.*)/)?.[1] || 'Unknown';
        const publishedAt = frontmatter.match(/published_at: (.*)/)?.[1] || '';
        const url = frontmatter.match(/url: (.*)/)?.[1] || '';

        // Extract transcript (everything after the "## Transcript" heading)
        const transcriptMatch = content.match(/## Transcript\n\n([\s\S]*?)\n\n---/);
        const transcript = transcriptMatch ? transcriptMatch[1] : '';

        transcripts.push({
          file,
          title,
          channel,
          publishedAt: new Date(publishedAt),
          url,
          transcript,
        });
      }
    } catch (error) {
      console.error(`Failed to read file: ${file}`, error);
    }
  }

  return transcripts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
