/**
 * Parses a YouTube URL and returns its 11-character video ID.
 * Supports standard watch URLs, mobile youtu.be, embed, and various query parameters.
 */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
}

/**
 * Parses any YouTube URL and generates a valid iframe embed URL.
 * Returns null if the URL is invalid.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
