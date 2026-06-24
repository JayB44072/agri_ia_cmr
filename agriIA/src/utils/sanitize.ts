/**
 * Strips characters that could alter an LLM prompt's structure.
 * Keeps alphanumeric, accented chars, basic punctuation, and whitespace.
 */
export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/[{}[\]`]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 500);
}
