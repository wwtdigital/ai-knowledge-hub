import { z } from 'zod';

// Maximum sizes to prevent abuse
const MAX_TRANSCRIPT_LENGTH = 100000; // 100KB of text
const MAX_TITLE_LENGTH = 500;
const MAX_TRANSCRIPTS_FOR_REPORT = 50;

/**
 * Validation schema for analyze endpoint
 */
export const analyzeRequestSchema = z.object({
  transcript: z
    .string()
    .min(1, 'Transcript cannot be empty')
    .max(MAX_TRANSCRIPT_LENGTH, `Transcript too long (max ${MAX_TRANSCRIPT_LENGTH} characters)`),
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(MAX_TITLE_LENGTH, `Title too long (max ${MAX_TITLE_LENGTH} characters)`),
});

/**
 * Validation schema for trend report endpoint
 */
export const trendReportRequestSchema = z.object({
  transcripts: z
    .array(
      z.object({
        title: z.string().max(MAX_TITLE_LENGTH),
        transcript: z.string().max(MAX_TRANSCRIPT_LENGTH),
        date: z.string().datetime(),
      })
    )
    .min(1, 'At least one transcript required')
    .max(MAX_TRANSCRIPTS_FOR_REPORT, `Too many transcripts (max ${MAX_TRANSCRIPTS_FOR_REPORT})`),
});

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9-_.]/gi, '-') // Replace invalid chars with dash
    .replace(/--+/g, '-') // Remove consecutive dashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 200); // Limit length
}

/**
 * Validate request body against schema
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation failed' };
  }
}
