import { memo, useMemo, useCallback } from "react";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { Work } from "../types";
import { useMapStore, useMapActions } from "../store/useMapStore";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { Badge } from "@/components/shadcn/badge";
import { ImagemTooltip } from "./ImagemTooltip";
import { getCategoryColors, getCategoryColorForTheme } from "../constants";

const createMarkerIcon = (work: Work, isSelected: boolean, isDark: boolean): L.DivIcon => {
  const size = work.size || 60;
  const progress = Math.round(work.executionPercentage);
  const color = getCategoryColorForTheme(work.category, isDark);

  const strokeWidth = 4;
  const radius = size / 2;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const centerDotRadius = 5;
  const darkerColor = `color-mix(in srgb, ${color} 70%, black)`;
  // Halo atrás do arco de execução: o arco sozinho dava 2,4 a 3,4:1 sobre os tiles claros
  const halo = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)";
  // Legenda abaixo da bolha (contrato + município); visibilidade por zoom controlada em MapEffect (.mostra-municipios)
  const escapar = (texto: string) => texto.replace(/[<>&]/g, "");
  const legenda = `
      <span class="legenda-obra">
        <strong>${escapar(work.contractNumber)}</strong>
        ${work.municipio ? `<small>${escapar(work.municipio)}</small>` : ""}
      </span>`;

  // SVG simplificado sem gradiente único por work (usa cor sólida com opacidade)
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg);">
        <circle cx="${size / 2}" cy="${size / 2}" r="${normalizedRadius}" fill="${color}" fill-opacity="0.15"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${normalizedRadius}" fill="transparent" stroke="${darkerColor}" stroke-width="2" stroke-opacity="0.5"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${normalizedRadius}" fill="transparent" stroke="${halo}" stroke-width="${strokeWidth + 2}" stroke-dasharray="${circumference} ${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${normalizedRadius}" fill="transparent" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="${circumference} ${circumference}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${centerDotRadius}" fill="${color}" stroke="${darkerColor}" stroke-width="1.5"/>
      </svg>${legenda}
    </div>
  `;

  return L.divIcon({
    html,
    className: `custom-marker${isSelected ? " z-50" : ""}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface WorkMarkerProps {
  work: Work;
}

// Componente para o conteúdo do tooltip com a imagem
const WorkTooltipContent = ({ work }: { work: Work }) => {
  const executionText = work.executionPercentage
    ? `${work.executionPercentage.toFixed(0)}%`
    : "-";

  const titulo = work.title !== work.id ? work.title : `Obra ${work.codigoObra || work.id}`;
  const subtitulo = [work.municipio, `Contrato ${work.contractNumber}`].filter(Boolean).join(" · ");

  return (
    // Fundo popover vem de .work-tooltip > div (Map.style.css)
    <div className="flex flex-col min-w-[220px] max-w-[280px] overflow-hidden rounded-lg">
      {/* Imagem com badge de categoria (texto escuro sobre a variante clara: legível nos dois temas) */}
      <ImagemTooltip src={work.fotoUrl} alt={titulo} corFundo="var(--colors-muted)">
        <Badge
          title={work.category}
          className="absolute top-1 left-1 rounded border-none px-2 py-0.5 text-[9px] leading-tight font-semibold whitespace-nowrap text-category-foreground shadow-lg"
          style={{ backgroundColor: getCategoryColors(work.category).light }}
        >
          {work.category}
        </Badge>
      </ImagemTooltip>

      {/* Info */}
      <div className="space-y-1 p-2">
        <p className="text-foreground line-clamp-2 text-xs font-semibold">{titulo}</p>
        <p className="text-muted-foreground truncate text-[11px]">{subtitulo}</p>
        <p className="text-muted-foreground text-[11px] leading-4 tracking-[0.11px]">
          Executado: <span className="text-foreground font-medium">{executionText}</span>
        </p>
      </div>
    </div>
  );
};

export const WorkMarker = memo(({ work }: WorkMarkerProps) => {
  // Only subscribe to the selected work ID, not the entire object
  const isSelected = useMapStore((state) => state.selectedWork?.id === work.id);
  const { selectWork } = useMapActions();
  const { isDark } = useTheme();

  const handleClick = useCallback(() => {
    selectWork(work);
  }, [selectWork, work]);

  const icon = useMemo(
    () => createMarkerIcon(work, isSelected, isDark),
    [work, isSelected, isDark]
  );

  if (!work.location) {
    return null;
  }

  return (
    <Marker
      position={[work.location.lat, work.location.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Tooltip
        direction="top"
        offset={[0, -(work.size / 2) - 8]}
        opacity={1}
        className="work-tooltip"
      >
        <WorkTooltipContent work={work} />
      </Tooltip>
    </Marker>
  );
});

WorkMarker.displayName = "WorkMarker";
