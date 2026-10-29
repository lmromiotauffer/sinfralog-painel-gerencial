import { useEffect, useState, type ReactNode } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/tailwind/cn";

interface ImagemTooltipProps {
  src?: string;
  alt: string;
  corFundo: string;
  // Badges sobrepostos à imagem
  children?: ReactNode;
}

// Imagem dos tooltips do mapa e dos cards da lista de obras: spinner enquanto carrega, placeholder em erro/sem URL e overlay em gradiente
export const ImagemTooltip = ({ src, alt, corFundo, children }: ImagemTooltipProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reinicia o estado quando a URL muda
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className="relative h-28 w-full overflow-hidden" style={{ backgroundColor: corFundo }}>
      {!isLoaded && !hasError && src && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      )}

      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center">
          <Camera size={24} className="opacity-50" />
        </div>
      )}

      {children}

      <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/60 to-transparent" />
    </div>
  );
};
