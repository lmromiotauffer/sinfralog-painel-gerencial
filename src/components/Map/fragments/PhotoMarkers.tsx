import { CircleMarker, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import { Camera } from "lucide-react";
import type { WorkPhoto } from "../hooks/useWorkDetails";
import {
  useMapStore,
  useSelectedWork,
  useIsDetailOpen,
  useSelectedPhotoIndex,
  useMapActions
} from "../store/useMapStore";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { ImagemTooltip } from "./ImagemTooltip";
import { getCategoryColorForTheme } from "../constants";
import { MapLayerType } from "../types";

interface PhotoMarkersProps {
  currentLayer?: MapLayerType;
}

type FotoNoMapa = WorkPhoto & { location: NonNullable<WorkPhoto["location"]>; originalIndex: number };

// Componente para o conteúdo do tooltip da foto com loading
const PhotoTooltipContent = ({
  photo,
  isSelected,
  workColor
}: {
  photo: FotoNoMapa;
  isSelected: boolean;
  workColor: string;
}) => {
  return (
    // Fundo popover vem de .photo-tooltip > div (Map.style.css)
    <div className="flex flex-col min-w-60 max-w-[320px] overflow-hidden rounded-lg">
      <ImagemTooltip src={photo.url} alt={`Foto ${photo.originalIndex + 1}`} corFundo="var(--colors-muted)">
        {/* Badge de foto ativa */}
        {isSelected && (
          <span
            className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium shadow-lg"
            style={{
              backgroundColor: 'var(--colors-primary)',
              color: 'var(--colors-primary-foreground)'
            }}
          >
            Ativa
          </span>
        )}
      </ImagemTooltip>

      {/* Info */}
      <div className="space-y-1 p-2">
        {/* Header com ícone de câmera + número */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-5 h-5 rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${workColor} 20%, transparent)` }}
          >
            <Camera size={12} style={{ color: workColor }} />
          </div>
          <span className="font-semibold text-sm">
            Foto {photo.originalIndex + 1}
          </span>
        </div>

        {/* Data da foto */}
        {photo.date && photo.date !== "-" && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="font-medium opacity-70">Data:</span>
            <span>{photo.date}</span>
          </div>
        )}

        {/* Serviço */}
        {photo.service && photo.service !== "-" && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium opacity-70">Serviço:</span>{" "}
            <span style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{photo.service}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const PhotoMarkers = ({ currentLayer }: PhotoMarkersProps) => {
  const selectedWork = useSelectedWork();
  const isDetailOpen = useIsDetailOpen();
  const selectedPhotoIndex = useSelectedPhotoIndex();
  const { setMapFocusPoint, setSelectedPhotoIndex } = useMapActions();
  const { isDark } = useTheme();
  // Mesmas fotos da galeria do WorkDetail, que as publica no store
  const workPhotos = useMapStore((state) => state.workPhotos);

  // Filtrar apenas fotos com localização válida e manter índice original
  const photosWithLocation = useMemo<FotoNoMapa[]>(() => {
    return workPhotos
      .map((photo, index) => ({ ...photo, originalIndex: index }))
      .filter((photo): photo is FotoNoMapa => photo.location !== null);
  }, [workPhotos]);

  // Só mostrar quando há uma obra selecionada e o detalhe está aberto
  if (!selectedWork || !isDetailOpen || photosWithLocation.length === 0) {
    return null;
  }

  const handlePhotoClick = (photo: FotoNoMapa) => {
    // Atualizar o índice da foto selecionada na galeria
    setSelectedPhotoIndex(photo.originalIndex);
    // Centralizar o mapa nela
    setMapFocusPoint(photo.location);
  };

  // Usar cor do tipo de obra
  const workColor = getCategoryColorForTheme(selectedWork.category, isDark);

  // Cor da borda - versão mais escura da cor da obra
  const borderColor = `color-mix(in srgb, ${workColor} 60%, black)`;

  return (
    <>
      {photosWithLocation.map((photo) => {
        const isSelected = photo.originalIndex === selectedPhotoIndex;

        return (
          <CircleMarker
            key={`photo-${photo.originalIndex}-${photo.url}-${currentLayer}`}
            center={[photo.location.lat, photo.location.lng]}
            radius={isSelected ? 12 : 9}
            pane="markerPane"
            pathOptions={{
              color: borderColor,
              fillColor: workColor,
              // Foto selecionada sólida; demais com transparência
              fillOpacity: isSelected ? 1 : 0.25,
              weight: 1,
            }}
            eventHandlers={{
              click: () => handlePhotoClick(photo),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -12]}
              opacity={1}
              className="photo-tooltip"
            >
              <PhotoTooltipContent
                photo={photo}
                isSelected={isSelected}
                workColor={workColor}
              />
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
};
