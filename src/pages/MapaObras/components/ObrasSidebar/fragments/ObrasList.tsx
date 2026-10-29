import { useRef, useState, memo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/tailwind/cn";
import { Badge } from "@/components/shadcn/badge";
import type { SidebarObra } from "../hooks/useSidebarData";
import { ImagemTooltip } from "@/components/Map/fragments/ImagemTooltip";
import { getCategoryColors } from "@/components/Map/constants";
import { formatadorBRL } from "@/shared/utils/formatarMoeda";

const CARD_HEIGHT = 190; // Altura fixa do card
const LARGURA_COLUNA = 224; // Largura mínima de cada coluna no modo expandido

interface ObrasListProps {
  obras: SidebarObra[];
  selectedObraId?: string | null;
  onObraClick?: (obra: SidebarObra) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  // Infinite scroll
  hasMoreData?: boolean;
  isFetching?: boolean | null;
  onLoadMore?: () => void;
}

// Card com foto similar ao WorkDetail
const ObraCard = memo(
  ({
    obra,
    isSelected,
    onClick,
  }: {
    obra: SidebarObra;
    isSelected: boolean;
    onClick: () => void;
  }) => {
    const titulo = obra.nome || `Obra ${obra.codigoObra || obra.id}`;
    const subtitulo = [obra.municipio, `Contrato ${obra.contrato}`].filter(Boolean).join(" · ");

    return (
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={`${titulo}, ${subtitulo}, ${obra.execucao}% executado`}
        className={cn(
          "block w-full cursor-pointer overflow-hidden rounded-lg text-left transicao-feedback",
          "hover:border-primary/50 border border-transparent",
          "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
          isSelected && "border-primary ring-primary/30 ring-1",
        )}
        onClick={onClick}
      >
        <ImagemTooltip
          src={obra.fotoUrl}
          alt={obra.codigoObra || obra.id}
          corFundo="color-mix(in oklab, var(--color-muted) 30%, transparent)"
        >

          {/* Texto escuro sobre a variante clara da categoria: legível nos dois temas (a variante escura dava 2,7 a 3,9:1).
              9px em uma linha: a categoria mais longa ("Obras de arte especiais/correntes") cabe inteira no card
              estreito com folga à direita como os selos curtos (a 11px estourava). title garante o texto no hover. */}
          <Badge
            title={obra.tipoObra}
            className="absolute top-1 left-1 rounded border-none px-2 py-0.5 text-[9px] leading-tight font-semibold whitespace-nowrap text-category-foreground shadow-lg"
            style={{ backgroundColor: getCategoryColors(obra.tipoObra).light }}
          >
            {obra.tipoObra}
          </Badge>
        </ImagemTooltip>

        <div className="bg-sidebar/50 flex flex-col gap-0.5 p-2 text-[11px] leading-4">
          <p className="text-foreground truncate text-xs font-semibold" title={titulo}>
            {titulo}
          </p>
          <p className="text-muted-foreground truncate" title={subtitulo}>
            {subtitulo}
          </p>
          <p className="text-foreground truncate">
            <span className="text-muted-foreground">Valor: </span>
            {formatadorBRL.format(obra.valor)}
          </p>
        </div>
      </button>
    );
  },
  (prev, next) =>
    prev.obra.id === next.obra.id &&
    prev.isSelected === next.isSelected &&
    prev.obra.fotoUrl === next.obra.fotoUrl
);

ObraCard.displayName = "ObraCard";

// Já chega ordenada (com foto primeiro) pelo ObrasSidebar
export const ObrasList = ({
  onToggleExpand,
  obras,
  selectedObraId,
  onObraClick,
  isExpanded = false,
  hasMoreData = false,
  isFetching = false,
  onLoadMore,
}: ObrasListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const showLoader = hasMoreData || isFetching;

  // Colunas seguem a largura real do contêiner (a expansão anima a largura em 250ms)
  const [colunas, setColunas] = useState(1);
  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setColunas(Math.max(1, Math.floor(entry.contentRect.width / LARGURA_COLUNA)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Virtualizado nos dois modos: expandido usa lanes (grade) em vez de montar todos os cards
  const rowVirtualizer = useVirtualizer({
    count: obras.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT,
    lanes: colunas,
    overscan: 5 * colunas,
  });

  useEffect(() => {
    if (selectedObraId) {
      const index = obras.findIndex((o) => o.id === selectedObraId);
      if (index !== -1 && !isExpanded) {
        rowVirtualizer.scrollToIndex(index, { align: "center", behavior: "auto" });
      }
    }
  }, [selectedObraId, obras, rowVirtualizer, isExpanded]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || isFetching || !hasMoreData) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < 300) {
      onLoadMore();
    }
  };

  const virtualItems = rowVirtualizer.getVirtualItems();

  const loader = isFetching ? (
    <Loader2 size={20} className="text-muted-foreground animate-spin" />
  ) : hasMoreData ? (
    <span className="text-muted-foreground text-xs">
      Role para ver mais obras
    </span>
  ) : null;

  // O contêiner de rolagem fica sempre montado: os efeitos acima dependem de parentRef desde o início
  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 overflow-y-auto"
    >
      {obras.length === 0 && (
        <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
          Nenhuma obra encontrada
        </div>
      )}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => {
          const obra = obras[virtualItem.index];
          const isSelected = obra.id === selectedObraId;
          // Onda diagonal a partir do canto superior direito, onde estava a coluna estreita
          const linhaVisivel = Math.max(
            0,
            Math.floor((virtualItem.start - (rowVirtualizer.scrollOffset ?? 0)) / CARD_HEIGHT),
          );
          const ordem = linhaVisivel + (colunas - 1 - virtualItem.lane);

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              data-ordem
              style={{
                "--ordem": ordem,
                position: "absolute",
                top: 0,
                left: `${(virtualItem.lane * 100) / colunas}%`,
                width: `${100 / colunas}%`,
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin}px)`,
                padding: "4px 8px",
              } as React.CSSProperties}
            >
              <ObraCard
                obra={obra}
                isSelected={isSelected}
                onClick={() => {
                  onObraClick?.(obra);
                  if (isExpanded) onToggleExpand?.();
                }}
              />
            </div>
          );
        })}
      </div>
      {showLoader && (
        <div className="flex items-center justify-center py-4">{loader}</div>
      )}
    </div>
  );
};