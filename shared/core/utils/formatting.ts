export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '');
} 