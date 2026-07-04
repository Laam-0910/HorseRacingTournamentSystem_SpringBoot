/**
 * Parses a YouTube URL and returns its 11-character video ID.
 * Supports standard watch URLs, mobile youtu.be, embed, and various query parameters.
 */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const tempUrl = url.trim();
  
  // Support for /live/VIDEO_ID, /shorts/VIDEO_ID, /embed/VIDEO_ID, /v/VIDEO_ID
  const pathPatterns = [
    /\/live\/([^"&?\/\s]{11})/,
    /\/shorts\/([^"&?\/\s]{11})/,
    /\/embed\/([^"&?\/\s]{11})/,
    /\/v\/([^"&?\/\s]{11})/
  ];
  
  for (const pattern of pathPatterns) {
    const match = tempUrl.match(pattern);
    if (match && match[1].length === 11) {
      return match[1];
    }
  }
  
  // Support for youtu.be/VIDEO_ID
  if (tempUrl.includes("youtu.be/")) {
    const parts = tempUrl.split("youtu.be/");
    if (parts.length > 1) {
      const id = parts[1].split(/[?#]/)[0];
      if (id.length === 11) return id;
    }
  }
  
  // Support for watch?v=VIDEO_ID
  const regExp = /[?&]v=([^"&?\/\s]{11})/;
  const match = tempUrl.match(regExp);
  if (match && match[1].length === 11) {
    return match[1];
  }
  
  return null;
}

/**
 * Parses any YouTube URL and generates a valid iframe embed URL.
 * Returns null if the URL is invalid.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : url;
}
