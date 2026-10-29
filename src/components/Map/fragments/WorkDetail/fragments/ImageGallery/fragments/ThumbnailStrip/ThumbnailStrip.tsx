import { useRef, useEffect, memo, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/shared/utils/tailwind/cn";
import type { ThumbnailStripProps } from "../../types";
import type { WorkPhoto } from "@/components/Map/types";
import { isImageCached } from "../../utils";

const THUMBNAIL_WIDTH = 68;
const THUMBNAIL_HEIGHT = 40;
const THUMBNAIL_GAP = 8;

// Custom hook for drag-to-scroll functionality
// Hook personalizado para scroll arrastável (estilo mobile) em desktop
function useDragToScroll(containerRef: React.RefObject<HTMLDivElement | null>): React.MutableRefObject<boolean> {
  const isMouseDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDraggedRef = useRef<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown.current = true;
      hasDraggedRef.current = false;
      startX.current = e.pageX;
      scrollLeft.current = container.scrollLeft;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current) return;
      
      const walk = e.pageX - startX.current;
      
      // Só considera arrasto se mover mais de 5px (previne cliques acidentais)
      if (Math.abs(walk) > 5) {
        if (!hasDraggedRef.current) {
          hasDraggedRef.current = true;
          container.style.cursor = "grabbing";
          container.style.userSelect = "none";
        }
        e.preventDefault();
        container.scrollLeft = scrollLeft.current - walk;
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      container.style.cursor = "grab";
      container.style.userSelect = "";
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    };

    const handleMouseLeave = () => {
      if (isMouseDown.current) {
        isMouseDown.current = false;
        container.style.cursor = "grab";
        container.style.userSelect = "";
      }
    };

    container.style.cursor = "grab";
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [containerRef]);

  return hasDraggedRef;
}

// Componente de miniatura memoizado para evitar re-renderizações desnecessárias
interface ThumbnailItemProps {
  photo: WorkPhoto;
  index: number;
  total: number;
  isActive: boolean;
  left: number;
  onSelect: (index: number) => void;
  hasDraggedRef: React.MutableRefObject<boolean>;
}

const ThumbnailItem = memo(
  ({ photo, index, total, isActive, left, onSelect, hasDraggedRef }: ThumbnailItemProps) => {
    const [isLoaded, setIsLoaded] = useState(() => isImageCached(photo.url));

    const handleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      // Não aciona clique se o usuário estava arrastando a lista
      if (hasDraggedRef.current) return;
      onSelect(index);
    }, [hasDraggedRef, onSelect, index]);

    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Foto ${index + 1} de ${total}`}
        aria-pressed={isActive}
        className={cn(
          "bg-muted/30 absolute top-0 overflow-hidden rounded transition-[border-color,opacity] duration-300 ease-out",
          isActive
            ? "border-foreground border-[1.5px]"
            : "border-0 opacity-70 hover:opacity-100",
        )}
        style={{
          left: `${left}px`,
          width: `${THUMBNAIL_WIDTH}px`,
          height: `${THUMBNAIL_HEIGHT}px`,
        }}
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
  },
);

ThumbnailItem.displayName = "ThumbnailItem";

export const ThumbnailStrip = memo(
  ({ photos, currentIndex, onSelect }: ThumbnailStripProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const hasDraggedRef = useDragToScroll(containerRef);

    // Virtualização para lidar com listas longas de fotos com performance
    const virtualizer = useVirtualizer({
      count: photos.length,
      getScrollElement: () => containerRef.current,
      estimateSize: () => THUMBNAIL_WIDTH + THUMBNAIL_GAP,
      horizontal: true,
      overscan: 5,
    });

    // Centraliza a miniatura selecionada automaticamente
    useEffect(() => {
      virtualizer.scrollToIndex(currentIndex, {
        align: "center",
        behavior: "auto", // Scroll instantâneo
      });
    }, [currentIndex, virtualizer]);

    if (photos.length <= 1) return null;

    return (
      <div
        ref={containerRef}
        className="relative w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          className="relative"
          style={{
            width: `${virtualizer.getTotalSize()}px`,
            height: `${THUMBNAIL_HEIGHT}px`,
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <ThumbnailItem
              key={virtualItem.index}
              photo={photos[virtualItem.index]}
              index={virtualItem.index}
              total={photos.length}
              isActive={currentIndex === virtualItem.index}
              left={virtualItem.start}
              onSelect={onSelect}
              hasDraggedRef={hasDraggedRef}
            />
          ))}
        </div>
      </div>
    );
  },
);

ThumbnailStrip.displayName = "ThumbnailStrip";
