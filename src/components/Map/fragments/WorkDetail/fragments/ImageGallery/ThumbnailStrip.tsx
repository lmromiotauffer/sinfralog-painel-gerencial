import { useRef, useEffect, useState } from "react";
import { cn } from "@/shared/utils/tailwind/cn";
import type { WorkPhoto } from "@/components/Map/hooks/useWorkDetails";

interface ThumbnailStripProps {
  photos: WorkPhoto[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

interface ThumbnailItemProps {
  photo: WorkPhoto;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: (index: number) => void;
}

const ThumbnailItem = ({ photo, index, total, isActive, onSelect }: ThumbnailItemProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
      aria-label={`Foto ${index + 1} de ${total}`}
      aria-pressed={isActive}
      className={cn(
        "bg-muted/30 h-10 w-[68px] shrink-0 overflow-hidden rounded transition-[border-color,opacity] duration-(--duracao-media) ease-(--ease-cor)",
        isActive
          ? "border-foreground border-[1.5px]"
          : "border-0 opacity-70 hover:opacity-100",
      )}
    >
      <img
        src={photo.url}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "pointer-events-none h-full w-full object-cover transition-opacity duration-150",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
};

export const ThumbnailStrip = ({ photos, currentIndex, onSelect }: ThumbnailStripProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Centraliza a miniatura selecionada automaticamente (salto, sem animação)
  useEffect(() => {
    const container = containerRef.current;
    const ativa = container?.children[currentIndex] as HTMLElement | undefined;
    if (!container || !ativa) return;
    container.scrollLeft = ativa.offsetLeft - (container.clientWidth - ativa.offsetWidth) / 2;
  }, [currentIndex, photos]);

  if (photos.length <= 1) return null;

  return (
    <div
      ref={containerRef}
      className="relative flex w-full gap-2 overflow-x-auto [scrollbar-width:thin]"
    >
      {photos.map((photo, index) => (
        <ThumbnailItem
          key={index}
          photo={photo}
          index={index}
          total={photos.length}
          isActive={currentIndex === index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
