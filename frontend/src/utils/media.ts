const UNSPLASH_SOURCE = "https://source.unsplash.com/";

export function resolveAttractionImageUrl(attractionId: string, imageIndex: number, url: string): string {
  if (url.startsWith(UNSPLASH_SOURCE) || url.includes("source.unsplash.com")) {
    return `https://picsum.photos/seed/${encodeURIComponent(`${attractionId}-${imageIndex}`)}/800/600`;
  }
  return url;
}

export function resolvedImageUrls(attractionId: string, imageUrls: string[]): string[] {
  return imageUrls.map((url, index) => resolveAttractionImageUrl(attractionId, index, url));
}

/** YouTube embed URLs using listType=search are unreliable; treat as non-embed. */
export function isReliableYoutubeEmbedUrl(url: string): boolean {
  if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
    return false;
  }
  if (url.includes("listType=search")) {
    return false;
  }
  if (url.includes("/embed/") && !url.includes("list=")) {
    return true;
  }
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return true;
    }
    return Boolean(parsed.searchParams.get("v"));
  } catch {
    return false;
  }
}

export function getYoutubeEmbedUrl(rawUrl: string): string | null {
  if (!isReliableYoutubeEmbedUrl(rawUrl)) {
    return null;
  }

  if (rawUrl.includes("/embed/") && !rawUrl.includes("listType=search")) {
    return rawUrl.split("&")[0] ?? rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);
    const videoId = parsed.searchParams.get("v");
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      if (id) {
        return `https://www.youtube-nocookie.com/embed/${id}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeSearchUrl(attractionName: string): string {
  const q = `${attractionName} Disneyland Paris`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
