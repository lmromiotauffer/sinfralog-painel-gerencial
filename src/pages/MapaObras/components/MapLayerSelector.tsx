import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/shared/utils/tailwind/cn";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { MAP_LAYERS } from "@/components/Map/constants";

export type MapViewType = "satellite" | "map" | "street";

interface MapLayerSelectorProps {
  currentView: MapViewType;
  onViewChange: (view: MapViewType) => void;
  className?: string;
  size?: "default" | "small";
}

interface ViewOption {
  id: MapViewType;
  label: string;
  previewUrl: string;
}

// Prévia: um tile fixo (z10) da própria camada do mapa
const azulejo = (url: string) =>
  url.replace("{s}", "a").replace("{z}", "10").replace("{x}", "300").replace("{y}", "500").replace("{r}", "");

const getViewOptions = (isDark: boolean): ViewOption[] => [
  { id: "satellite", label: "Satélite", previewUrl: azulejo(MAP_LAYERS.satellite) },
  // Prévia escura ou clara conforme o tema
  { id: "map", label: "Padrão", previewUrl: azulejo(isDark ? MAP_LAYERS.dark : MAP_LAYERS.light) },
  { id: "street", label: "Ruas", previewUrl: azulejo(MAP_LAYERS.street) },
];

export const MapLayerSelector: React.FC<MapLayerSelectorProps> = ({
  currentView,
  onViewChange,
  className,
  size = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  
  const isSmall = size === "small";
  const viewOptions = getViewOptions(isDark);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentOption = viewOptions.find((opt) => opt.id === currentView) || viewOptions[0];
  const otherOptions = viewOptions.filter((opt) => opt.id !== currentView);

  const handleSelect = (view: MapViewType) => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Popup menu - appears below for small size (header), above for default (bottom) */}
      <div
        inert={!isOpen}
        role="group"
        aria-label="Fundos do mapa"
        className={cn(
          "absolute flex flex-col gap-1.5 transition-[opacity,translate] duration-200",
          isSmall
            ? "top-full left-0 mt-2"
            : "bottom-full left-0 mb-2",
          isOpen 
            ? "pointer-events-auto translate-y-0 opacity-100" 
            : cn(
                "pointer-events-none opacity-0",
                isSmall ? "translate-y-[-8px]" : "translate-y-2"
              )
        )}
      >
        {otherOptions.map((option, index) => (
          <button
            key={option.id}
            type="button"
            aria-label={`Fundo ${option.label}`}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center justify-end overflow-hidden rounded-lg border border-white/20 bg-black/30 shadow-lg backdrop-blur-sm transition-all duration-(--duracao-media) ease-(--ease-suave) hover:border-white/50 hover:shadow-xl",
              isSmall ? "h-[48px] w-[48px]" : "h-[60px] w-[60px]",
              isOpen
                ? "translate-y-0 opacity-100"
                : cn("opacity-0", isSmall ? "-translate-y-1.5" : "translate-y-1.5"),
            )}
            // Cascata a partir do botão na abertura; fecha tudo junto (saída mais rápida que entrada)
            style={{
              transitionDelay: isOpen
                ? `${(isSmall ? index : otherOptions.length - 1 - index) * 50}ms`
                : "0ms",
            }}
          >
            {/* Preview image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
              style={{ backgroundImage: `url(${option.previewUrl})` }}
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

            {/* Label */}
            <span className="relative z-10 mb-1 text-[11px] font-medium text-white drop-shadow-md">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main button - shows current selection */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Trocar fundo do mapa (atual: ${currentOption.label})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-end overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm transition-all hover:shadow-xl",
          isSmall ? "h-[56px] w-[56px]" : "h-[72px] w-[72px]",
          isOpen 
            ? "border-white/50 ring-2 ring-white/20" 
            : "border-white/20 hover:border-white/40"
        )}
      >
        {/* Previews empilhados: o fundo escolhido sobe de baixo cobrindo o anterior, como a troca no mapa */}
        <div className="absolute inset-0 isolate transition-transform duration-(--duracao-media) ease-(--ease-suave) group-hover:scale-105">
          {viewOptions.map((option) => {
            const ativo = option.id === currentView;
            return (
              <div
                key={option.id}
                className={cn(
                  "absolute inset-0 bg-cover bg-center transition-[clip-path]",
                  ativo
                    ? "z-[1] duration-(--duracao-longa) ease-(--ease-suave) [clip-path:inset(0)]"
                    : "z-0 delay-(--duracao-longa) duration-0 [clip-path:inset(100%_0_0_0)]"
                )}
                style={{ backgroundImage: `url(${option.previewUrl})` }}
              />
            );
          })}
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-(--duracao-curta) ease-(--ease-cor) group-hover:opacity-75" />

        {/* Label */}
        <span
          key={currentOption.id}
          className={cn(
            "relative z-10 font-medium text-white drop-shadow-md animate-in fade-in slide-in-from-bottom-1 duration-(--duracao-media) ease-(--ease-suave)",
            isSmall ? "mb-1 text-[11px]" : "mb-1.5 text-xs"
          )}
        >
          {currentOption.label}
        </span>

        {/* Expand indicator */}
        <div className={cn(
          "absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/40 transition-transform",
          isOpen && (isSmall ? "rotate-0" : "rotate-180")
        )}>
          <svg 
            className={cn(
              "text-white transition-transform",
              isSmall ? "h-2 w-2" : "h-2.5 w-2.5",
              isOpen && isSmall && "rotate-180"
            )}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSmall ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
          </svg>
        </div>
      </button>
    </div>
  );
};
