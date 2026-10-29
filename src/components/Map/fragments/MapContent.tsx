import { useState, useMemo, useEffect, memo, Fragment } from "react";
import { Loader2 } from "lucide-react";
import L from "leaflet";
import {
  useMap,
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Polyline,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { useSelectedWork } from "../store/useMapStore";
import { WorkMarker } from "./WorkMarker";
import { PhotoMarkers } from "./PhotoMarkers";
import { MAP_LAYERS, MAP_LAYERS_SEM_ROTULOS, getCategoryColorForTheme } from "../constants";
import { MapLayerType, Work } from "../types";
import { MapEffect } from "./MapEffect";
import { ColisaoLegendas } from "./ColisaoLegendas";
import { CamadaMunicipios } from "./CamadaMunicipios";
import { createClusterCustomIcon } from "../utils/mapUtils";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { movimentoReduzido } from "@/shared/hooks/useMovimentoReduzido";
import { cn } from "@/shared/utils/tailwind/cn";
import "leaflet/dist/leaflet.css";
// O plugin não importa o próprio CSS: sem ele as bolhas pulam para o cluster e ficam 200 ms paradas até sumir,
// em vez de deslizar (transição de transform/opacity de .leaflet-cluster-anim)
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "../Map.style.css";

interface MapContentProps {
  currentLayer: MapLayerType;
  works: Work[];
  isFetching?: boolean;
}

// Configurações para melhor performance
const OPCOES_TILES = { maxZoom: 19, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2 };

// Igual a --duracao-longa
const DURACAO_SAIDA_SEM_ROTULOS = 400;

// Camada sem rótulos do coroplético, imperativa para poder sair esmaecendo: desmontada na hora, os nomes de
// cidade da camada de baixo voltavam de uma vez ao entrar nas bolhas. Remove só depois do esmaecer, para não
// seguir baixando tiles invisíveis no zoom das bolhas. A transição de opacidade é .camada-sem-rotulos (Map.style.css).
const CamadaSemRotulos = ({ url }: { url?: string }) => {
  const map = useMap();

  useEffect(() => {
    if (!url) return;
    const camada = L.tileLayer(url, { ...OPCOES_TILES, zIndex: 2, className: "camada-sem-rotulos" }).addTo(map);
    return () => {
      if (movimentoReduzido()) {
        camada.remove();
        return;
      }
      camada.setOpacity(0);
      window.setTimeout(() => camada.remove(), DURACAO_SAIDA_SEM_ROTULOS);
    };
  }, [map, url]);

  return null;
};

const ATTRIBUTIONS: Record<MapLayerType, string> = {
  dark: "© CARTO © OSM",
  light: "© CARTO © OSM",
  street: "© OpenStreetMap",
  satellite: "© Esri",
};

export const MapContent = memo(
  ({ currentLayer, works, isFetching }: MapContentProps) => {
    const selectedWork = useSelectedWork();
    const { isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [coropletico, setCoropletico] = useState(false);
    const urlSemRotulos = coropletico ? MAP_LAYERS_SEM_ROTULOS[currentLayer] : undefined;
    const obraEmFoco = isFocused ? selectedWork : null;
    const cor = obraEmFoco ? getCategoryColorForTheme(obraEmFoco.category, isDark) : "";

    // Group endpoints to handle overlapping start/end points of different segments
    const routes = selectedWork?.routes;
    const routeEndpoints = useMemo(() => {
      if (!routes || routes.length === 0) return [];

      type Extremo = { pos: [number, number]; starts: number[]; ends: number[] };
      const pointsMap = new Map<string, Extremo>();
      // Fixed precision for coordinates to handle small floating point differences
      const ponto = (pos: [number, number]) => {
        const chave = `${pos[0].toFixed(6)},${pos[1].toFixed(6)}`;
        return pointsMap.get(chave) ?? pointsMap.set(chave, { pos, starts: [], ends: [] }).get(chave)!;
      };

      routes.forEach((route, idx) => {
        if (!route || route.length === 0) return;
        ponto(route[0]).starts.push(idx + 1);
        ponto(route[route.length - 1]).ends.push(idx + 1);
      });

      return Array.from(pointsMap.values());
    }, [routes]);

    return (
      <div
        className="relative z-0 h-full w-full overflow-hidden"
        data-map-layer={currentLayer}
      >
        {/* Sempre montado para entrar e sair esmaecendo. A entrada espera 150 ms: filtro que responde rápido
            não pisca o véu; o giro só roda enquanto carrega. */}
        <div
          aria-hidden={!isFetching}
          className={cn(
            "absolute inset-0 z-2000 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-[opacity,visibility]",
            isFetching
              ? "visible opacity-100 delay-150 duration-(--duracao-media) ease-(--ease-cor)"
              : "pointer-events-none invisible opacity-0 duration-(--duracao-curta) ease-(--ease-saida)",
          )}
        >
          <div className="rounded-full bg-background/80 p-3 shadow-lg backdrop-blur-sm">
            <Loader2 className={cn("h-8 w-8 text-primary", isFetching && "animate-spin")} />
          </div>
        </div>

        {/* Custom discrete attribution */}
        <div className="pointer-events-none absolute right-1 bottom-1 z-1000">
          <span className="text-[9px] text-white/50 drop-shadow-sm">
            {ATTRIBUTIONS[currentLayer]}
          </span>
        </div>

        <MapContainer
          center={[-12.7, -55.9]}
          zoom={6}
          minZoom={4}
          maxZoom={19}
          zoomSnap={0.25}
          zoomDelta={0.25}
          wheelPxPerZoomLevel={120}
          maxBounds={[
            [-36, -76], // Southwest coordinates
            [7, -32], // Northeast coordinates,
          ]}
          maxBoundsViscosity={1.0}
          className="bg-background h-full w-full outline-none"
          zoomControl={false}
          attributionControl={false}
        >
          <MapEffect setIsFocused={setIsFocused} setCoropletico={setCoropletico} works={works} />
          <ColisaoLegendas />

          {/* key em vez de trocar a url: setUrl chama redraw(), que em zoom fracionário (zoomSnap 0.25) pede
              tiles com z=7.5 e o CARTO devolve um tile do mundo inteiro (o "mapa em cima da África"). */}
          <TileLayer key={currentLayer} url={MAP_LAYERS[currentLayer]} {...OPCOES_TILES} />

          {/* Coroplético: variante sem rótulos de cidade por cima da normal, que segue carregada para a volta não piscar */}
          <CamadaSemRotulos url={urlSemRotulos} />

          <CamadaMunicipios works={works} currentLayer={currentLayer} />

          {/* Show routes (lines) for selected work */}
          {obraEmFoco?.routes
            ?.filter((route) => route.length > 1)
            .map((route, routeIdx) => (
              <Polyline
                key={`route-line-${obraEmFoco.id}-${routeIdx}-${currentLayer}`}
                positions={route}
                pathOptions={{ color: cor, weight: 4, opacity: 0.8 }}
              />
            ))}

          {/* Show GeoTrechos for selected work */}
          {obraEmFoco?.geoTrechos?.map((trecho, trechoIdx) => (
            <Fragment key={`geo-trecho-group-${obraEmFoco.id}-${trechoIdx}-${currentLayer}`}>
              {trecho.length > 1 ? (
                <>
                  {/* Visible line */}
                  <Polyline
                    positions={trecho}
                    interactive={false}
                    pathOptions={{ color: cor, weight: 2, opacity: 0.6 }}
                  />
                  {/* Thicker invisible line for hit area (padding) */}
                  <Polyline positions={trecho} pathOptions={{ color: "transparent", weight: 15 }}>
                    {obraEmFoco.siglaRodovia && (
                      <Tooltip sticky direction="top">
                        {obraEmFoco.siglaRodovia}
                      </Tooltip>
                    )}
                  </Polyline>
                </>
              ) : (
                trecho.length === 1 && (
                  <>
                    {/* Visible marker */}
                    <CircleMarker
                      center={trecho[0]}
                      radius={4}
                      interactive={false}
                      pathOptions={{ color: "#fff", fillColor: cor, fillOpacity: 1, weight: 1 }}
                    />
                    {/* Larger invisible marker for hit area */}
                    <CircleMarker
                      center={trecho[0]}
                      radius={12}
                      pathOptions={{ color: "transparent", fillColor: "transparent" }}
                    >
                      {obraEmFoco.siglaRodovia && (
                        <Tooltip sticky direction="top">
                          {obraEmFoco.siglaRodovia}
                        </Tooltip>
                      )}
                    </CircleMarker>
                  </>
                )
              )}
            </Fragment>
          ))}

          {/* 2. Grouped Endpoints (Markers) - Rendered after everything else to catch hover priority */}
          {obraEmFoco &&
            routeEndpoints.map(({ pos, starts, ends }, idx) => {
              const totalSegments = obraEmFoco.routes?.length || 0;

              // Determine colors and labels
              let fillColor = cor;
              let label = "";

              if (starts.length > 0 && ends.length > 0) {
                // Collision point
                fillColor = "var(--colors-accent-foreground)"; // Conexões
                label = `Início Trecho ${starts.join(", ")}. Fim Trecho ${ends.join(", ")}`;
              } else if (starts.length > 0) {
                // Origin point(s)
                fillColor = "var(--colors-n-success)"; // Início
                label = totalSegments > 1 ? `Início Trecho ${starts.join(", ")}` : "Início";
              } else if (ends.length > 0) {
                // Termination point(s)
                fillColor = "var(--colors-destructive)"; // Fim
                label = totalSegments > 1 ? `Fim Trecho ${ends.join(", ")}` : "Fim";
              }

              return (
                <CircleMarker
                  key={`endpoint-${obraEmFoco.id}-${idx}-${currentLayer}`}
                  center={pos}
                  radius={8}
                  pane="markerPane"
                  pathOptions={{ color: "#fff", fillColor, fillOpacity: 1, weight: 2 }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    {label}
                  </Tooltip>
                </CircleMarker>
              );
            })}

          <MarkerClusterGroup
            chunkedLoading
            chunkInterval={200}
            chunkDelay={50}
            showCoverageOnHover={false}
            disableClusteringAtZoom={19}
            maxClusterRadius={60}
            iconCreateFunction={createClusterCustomIcon}
            // "Pernas" do spiderfy invisíveis
            spiderLegPolylineOptions={{ weight: 1.5, opacity: 0 }}
            spiderfyDistanceMultiplier={2}
          >
            {/* Hide all markers when a work is selected and focused */}
            {!obraEmFoco && works.map((work) => <WorkMarker key={work.id} work={work} />)}
          </MarkerClusterGroup>

          {/* Photo markers - Render last to prioritize their tooltips over everything else */}
          <PhotoMarkers currentLayer={currentLayer} />
        </MapContainer>
      </div>
    );
  },
);
