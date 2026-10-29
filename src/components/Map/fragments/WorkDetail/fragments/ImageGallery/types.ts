import type { WorkPhoto } from "../../../../types";

export interface ImageGalleryProps {
  photos: WorkPhoto[];
  title: string;
  category: string;
  color: string;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export interface ThumbnailStripProps {
  photos: WorkPhoto[];
  currentIndex: number;
  onSelect: (index: number) => void;
}
