import { useState, useCallback, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/shadcn/carousel";
import { Camera } from "lucide-react";
import type { WorkPhoto } from "@/components/Map/hooks/useWorkDetails";
import { CarouselImage } from "./CarouselImage";
import { ThumbnailStrip } from "./ThumbnailStrip";

interface ImageGalleryProps {
  photos: WorkPhoto[];
  title: string;
  category: string;
  color: string;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const ImageGallery = ({
  photos,
  title,
  category,
  color,
  currentIndex,
  onIndexChange,
}: ImageGalleryProps) => {
  const [api, setApi] = useState<CarouselApi>();

  // Sincronização da API do carrossel (Embla); o Carousel só entrega a API já inicializada
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const index = api.selectedScrollSnap();
      if (index !== currentIndex) {
        onIndexChange(index);
      }
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, currentIndex, onIndexChange]);

  // Handler para seleção de miniatura: Navegação instantânea (sem scroll suave)
  const handleThumbnailSelect = useCallback(
    (index: number) => {
      onIndexChange(index);
      api?.scrollTo(index, true); // true = jump (sem animação)
    },
    [api, onIndexChange],
  );

  // Sincroniza o carrossel quando o índice muda externamente (ex: clique no mapa)
  useEffect(() => {
    if (api && api.selectedScrollSnap() !== currentIndex) {
      api.scrollTo(currentIndex, true);
    }
  }, [api, currentIndex]);

  return (
    <div className="flex flex-col gap-2">
      {photos.length === 0 ? (
        <div className="bg-muted/50 border-border/50 text-muted-foreground flex h-[clamp(150px,calc(100dvh-660px),305px)] w-full flex-col items-center justify-center overflow-hidden rounded-lg border">
          <Camera size={32} className="mb-2 opacity-50" />
          <span className="text-sm">Sem fotos disponíveis</span>
        </div>
      ) : (
        <div className="group relative w-full">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: photos.length > 1,
            }}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {photos.map((photo, idx) => (
                <CarouselItem key={idx} className="pl-0">
                  {/* key pela URL: outra foto no mesmo índice recomeça sem o estado de erro/carregada da anterior */}
                  <CarouselImage
                    key={photo.url}
                    photo={photo}
                    index={idx}
                    title={title}
                    category={category}
                    color={color}
                    // Only load images that are adjacent to current (within 1 position)
                    isVisible={Math.abs(idx - currentIndex) <= 1}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Buttons - Figma style */}
            {photos.length > 1 && (
              <>
                <CarouselPrevious className="text-foreground bg-sidebar dark:bg-sidebar backdrop-blur-custom borda-vidro border-(--vidro-borda) dark:border-(--vidro-borda) top-auto bottom-0 left-1 h-9 w-9 rounded shadow-2xs" />
                <CarouselNext className="text-foreground bg-sidebar dark:bg-sidebar backdrop-blur-custom borda-vidro border-(--vidro-borda) dark:border-(--vidro-borda) top-auto right-1 bottom-0 h-9 w-9 rounded shadow-2xs" />
              </>
            )}
          </Carousel>
        </div>
      )}

      <ThumbnailStrip
        photos={photos}
        currentIndex={currentIndex}
        onSelect={handleThumbnailSelect}
      />
    </div>
  );
};
