import React, { useEffect, useRef, useState } from "react";
import useFetchJson from "@/shared/hooks/useFetchJson";
import Card from "@/components/Card/components/Root/Root";
import SliderKpis from "./components/SliderKpis";
import { Skeleton } from "@/components/shadcn/skeleton";
import { createPortal } from "react-dom";
import { EmblaCarouselType } from "embla-carousel";
import {
  Map,
  useMapData,
  useMapActions,
  useMapVariable,
  useIsDetailOpen,
  useMapStore,
} from "@/components/Map";
import type { MapLayerType } from "@/components/Map/types";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { WorkDetail } from "@/components/Map/fragments/WorkDetail/WorkDetail";
import { MapLayerSelector, MapViewType } from "./components/MapLayerSelector";
import { LegendaTipos } from "./components/LegendaTipos";
import SearchBox from "@/components/SearchBox/SearchBox";
import Typography from "@/components/Typography/Typography";
import { Map as MapIcon } from "lucide-react";
import { useMobileScreen } from "@/shared/hooks/useMobileScreen";
import { cn } from "@/shared/utils/tailwind/cn";
import { MapaObrasRouteLabel } from "@/routes/components/MapaObrasRouteLabel";
import { SliderButtons } from "@/components/Slider/components/SliderButtons";

export const MapaObras: React.FC = () => {
  const { data, isLoading } = useFetchJson("./pages/mapa-de-obras.json");
  const { isDark: themeIsDark } = useTheme();
  const { works, loading: worksLoading, isFetching } = useMapData(data?.map);
  const { setSelectedWork, clearSelectedWork } = useMapVariable();
  const { setWorks } = useMapActions();
  const isDetailOpen = useIsDetailOpen();
  const isMobile = useMobileScreen(1024);

  // Track which view the user selected
  const [currentView, setCurrentView] = useState<MapViewType>("map");
  const [emblaApi, setEmblaApi] = useState<EmblaCarouselType | undefined>(undefined);

  // Calculate actual map layer based on view selection and theme
  // Satellite: always satellite tiles
  // Map: follows theme (dark = CARTO dark, light = CARTO light)
  // Street: always OpenStreetMap (light style)
  const mapLayer: MapLayerType =
    currentView === "map" ? (themeIsDark ? "dark" : "light") : currentView;

  // Espelha a obra aberta no Qlik (filtra fotos e detalhes). Só na troca de obra: ao montar, não mexe na seleção existente
  const obraSelecionadaId = useMapStore((s) => s.selectedWork?.id);
  const obraAnteriorRef = useRef(obraSelecionadaId);
  useEffect(() => {
    if (obraSelecionadaId === obraAnteriorRef.current) return;
    obraAnteriorRef.current = obraSelecionadaId;
    if (obraSelecionadaId) setSelectedWork(obraSelecionadaId);
    else clearSelectedWork();
  }, [obraSelecionadaId, setSelectedWork, clearSelectedWork]);

  // Sync works to store so sidebar can access them
  // Always update when works changes, including when filtered to empty
  useEffect(() => {
    setWorks(works);
  }, [works, setWorks]);

  if (isLoading) {
    return <Skeleton className="h-full w-full rounded-lg" />;
  }

  return (
    <div className="@container/mapa pointer-events-none relative flex h-full w-full flex-col">
      {/* portal to transport map component to body to avoid instance in layout level */}
      {createPortal(
        <div className="pointer-events-auto absolute inset-0 z-0">
          <Map
            works={works}
            currentLayer={mapLayer}
            isFetching={worksLoading || !!isFetching}
          />
        </div>,
        document.body,
      )}

      {/* WorkDetail - positioned absolutely from top to bottom, over header */}
      <WorkDetail config={data?.mapDetails} />

      {/* Header with title and search/layer selector */}
      <header
        className={cn(
          // @container: a busca encolhe pela largura do próprio cabeçalho (menu aberto ou não), sem quebrar o título
          "@container group pointer-events-auto relative flex w-full shrink-0 items-start justify-between",
          isMobile ? "mb-4" : "mb-6"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-1 px-4 py-6 ease-suave transition-transform duration-300 motion-reduce:transition-none group-has-[[data-expandida=true]]:translate-y-8",
            isMobile ? "max-w-full" : "max-w-[60%]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="text-secondary-foreground">
              <MapIcon size={isMobile ? 20 : 24} />
            </div>
            <div className="flex items-center gap-2">
              <Typography
                variant={isMobile ? "text-lg" : "text-2xl"}
                className={cn("font-semibold text-secondary-foreground", !isMobile && "whitespace-nowrap")}
              >
                Mapa de Obras
              </Typography>
              <MapaObrasRouteLabel />
            </div>
          </div>
          <Typography
            variant={isMobile ? "text-2xs" : "text-sm"}
            className="leading-relaxed text-secondary-foreground"
          >
            Encontre dados sobre obras da SINFRA pelo estado de Mato Grosso.
          </Typography>
        </div>

        {/* Desktop: SearchBox / Mobile: MapLayerSelector */}
        {isMobile ? (
          <div className="flex shrink-0 items-start pr-2 pt-4">
            <MapLayerSelector
              currentView={currentView}
              onViewChange={setCurrentView}
              size="small"
            />
          </div>
        ) : (
          <div className="flex w-[300px] shrink-0 justify-end pr-2 @max-[36rem]:w-[208px] xl:w-[380px]">
            <SearchBox />
          </div>
        )}
      </header>

      {/* Content area */}
      <div className="pointer-events-none relative flex flex-1 min-h-0 w-full">
        {/* MapLayerSelector - positioned above the KPIs bar, bottom left */}
        {isMobile ? (
          // Acima da barra "Lista de Obras" (bottom-[88px] + 44px de altura + 8px)
          <div className="absolute bottom-[140px] left-4 z-10">
            <LegendaTipos works={works} className="pointer-events-auto" />
          </div>
        ) : (
          <div
            className={cn(
              // desce 78px (até o rodapé, alinhada à Lista de Obras) quando a barra de KPIs sai de cena
              "absolute bottom-[78px] left-0 z-10 flex flex-col items-start gap-2 transition-[translate] duration-[350ms] ease-suave motion-reduce:transition-none",
              isDetailOpen ? "translate-y-[78px] delay-[80ms]" : "translate-y-0 delay-100",
            )}
          >
            <MapLayerSelector
              currentView={currentView}
              onViewChange={setCurrentView}
              className="pointer-events-auto"
            />
            {/* Sai só se não couber ao lado do card da obra (546px): área do mapa < 51rem (248 da legenda + 554 do card + folga), com menu aberto ou não */}
            <div
              className={cn(
                "transition-[opacity,visibility] motion-reduce:transition-none",
                isDetailOpen
                  ? "@max-[51rem]/mapa:invisible @max-[51rem]/mapa:opacity-0 duration-(--duracao-curta) ease-saida"
                  : "visible opacity-100 duration-[350ms] ease-suave delay-100",
              )}
            >
              <LegendaTipos works={works} className="pointer-events-auto" />
            </div>
          </div>
        )}

        {/* Slider Button - positioned above KPIs, only on desktop; some e volta junto com a barra */}
        {!isMobile && (
          <div
            className={cn(
              "absolute bottom-[78px] right-4 z-10 pointer-events-auto transition-[opacity,scale,visibility] motion-reduce:scale-100",
              isDetailOpen
                ? "invisible scale-75 opacity-0 duration-(--duracao-curta) ease-saida"
                : "visible scale-100 opacity-100 duration-[350ms] ease-suave delay-100",
            )}
          >
            <SliderButtons emblaApi={emblaApi} />
          </div>
        )}

        {/* Bottom bar with KPIs - sai de cena enquanto o card da obra está aberto (redundante) */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 flex items-end lg:pr-2 lg:pl-0 lg:pb-0 px-4 pb-4 transition-[opacity,translate,visibility] motion-reduce:translate-y-0",
            isDetailOpen
              ? "invisible translate-y-4 opacity-0 duration-(--duracao-curta) ease-saida"
              : "visible translate-y-0 opacity-100 duration-[350ms] ease-suave delay-100",
          )}
        >
          <Card className="pointer-events-auto h-[66px] flex-1 lg:h-[70px]">
            <SliderKpis kpis={data?.kpis} onEmblaApiReady={setEmblaApi} />
          </Card>
        </div>
      </div>
    </div>
  );
};
