import { useState } from "react";
import { Camera, Maximize, Loader2 } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/shared/utils/tailwind/cn";
import type { WorkPhoto } from "@/components/Map/hooks/useWorkDetails";

interface CarouselImageProps {
  photo: WorkPhoto;
  index: number;
  title: string;
  category: string;
  color: string;
  isVisible: boolean;
}

export const CarouselImage = ({
    photo,
    index,
    title,
    category,
    color,
    isVisible,
  }: CarouselImageProps) => {
    // Check if image is already loaded
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Renderiza a imagem somente se visível ou já carregada (otimização de DOM)
    const shouldRenderImage = isVisible || isLoaded;

    // ponytail: 660px = tudo que não é imagem no card (cabeçalho com subtítulo, miniaturas, linha do cronograma,
    // indicadores, descrição, gráfico no mínimo); a imagem absorve o déficit de altura. Se o card mudar, ajustar
    // aqui e no placeholder de ImageGallery; upgrade: imagem como flex-1 propagando h-full pelo carrossel do shadcn.
    return (
      <div className="bg-muted/30 relative h-[clamp(150px,calc(100dvh-660px),305px)] w-full overflow-hidden rounded-lg">
        {/* Spinner de carregamento - apenas se não houve erro e estiver visível */}
        {!isLoaded && !hasError && isVisible && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        )}

        {hasError ? (
          <div className="text-muted-foreground bg-muted/30 flex h-full w-full flex-col items-center justify-center">
            <Camera size={32} className="mb-2 opacity-50" />
            <span className="text-sm">Erro ao carregar foto</span>
          </div>
        ) : shouldRenderImage ? (
          <img
            src={photo.url}
            alt={`${title} - Foto ${index + 1}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-200",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}

        <Badge
          className="text-category-foreground absolute top-1 left-1 rounded border-none px-2 py-0.5 text-[11px] font-semibold tracking-wide"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 45%, white)` }}
        >
          {category}
        </Badge>

        {photo.date && (
          <Badge
            className="bg-popover text-popover-foreground absolute top-8 left-1 rounded border-none px-2 py-0.5 text-[11px] font-semibold tracking-wide"
          >
            {photo.date}
          </Badge>
        )}

        <div className="absolute top-1 right-1 flex gap-1">
          <Button
            size="icon"
            variant="outline"
            aria-label={`Abrir foto ${index + 1} em tamanho real`}
            className="bg-custom-bg-input-30 border-custom-focus! h-9 w-9 rounded shadow-2xs"
            onClick={() => {
              window.open(photo.url, "_blank");
            }}
          >
            <Maximize size={16} />
          </Button>
        </div>
      </div>
    );
  };
