import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/shadcn/carousel";
import { CarouselImage } from "../CarouselImage/CarouselImage";
import { ImagePlaceholder } from "../ImagePlaceholder/ImagePlaceholder";
import type { WorkPhoto } from "@/components/Map/types";

interface MainCarouselProps {
  photos: WorkPhoto[];
  title: string;
  category: string;
  color: string;
  currentIndex: number;
  onApiReady: (api: CarouselApi) => void;
  errorStates: Record<number, boolean>;
  onImageError: (index: number) => void;
}

export const MainCarousel = ({
  photos,
  title,
  category,
  color,
  currentIndex,
  onApiReady,
  errorStates,
  onImageError,
}: MainCarouselProps) => {
  if (photos.length === 0) {
    return <ImagePlaceholder />;
  }

  return (
    <div className="group relative w-full">
      <Carousel
        setApi={onApiReady}
        opts={{
          align: "start",
          loop: photos.length > 1,
        }}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {photos.map((photo, idx) => {
            // Only load images that are adjacent to current (within 1 position)
            const isVisible = Math.abs(idx - currentIndex) <= 1;
            return (
              <CarouselItem key={idx} className="pl-0">
                <CarouselImage
                  photo={photo}
                  index={idx}
                  title={title}
                  category={category}
                  color={color}
                  hasError={errorStates[idx] ?? false}
                  onImageError={() => onImageError(idx)}
                  isVisible={isVisible}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Navigation Buttons - Figma style */}
        {photos.length > 1 && (
          <>
            <CarouselPrevious className="text-foreground border-custom-focus! bg-custom-bg-input-30 top-auto bottom-0 left-1 h-9 w-9 rounded shadow-2xs" />
            <CarouselNext className="text-foreground border-custom-focus! bg-custom-bg-input-30 top-auto right-1 bottom-0 h-9 w-9 rounded shadow-2xs" />
          </>
        )}
      </Carousel>
    </div>
  );
};
