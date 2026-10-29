// Simple in-memory image cache with size limit (Map keeps insertion order → oldest first)
const MAX_CACHE_SIZE = 50; // Limit cache to 50 images
const imageCache = new Map<string, HTMLImageElement>();

export const preloadImage = (url: string): Promise<HTMLImageElement> => {
  // Return cached image if available
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (imageCache.size >= MAX_CACHE_SIZE) {
        imageCache.delete(imageCache.keys().next().value!);
      }
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const preloadImages = (urls: string[]): void => {
  // Only preload images not already in cache
  const uncachedUrls = urls.filter((url) => !imageCache.has(url));

  // Limit concurrent preloads to avoid overwhelming the browser
  const MAX_CONCURRENT = 3;
  uncachedUrls.slice(0, MAX_CONCURRENT).forEach((url) => {
    preloadImage(url).catch(() => {
      // Silently fail - image will load when needed
    });
  });
};

export const isImageCached = (url: string): boolean => {
  return imageCache.has(url);
};
