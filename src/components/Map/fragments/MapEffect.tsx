import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useSelectedWork, useMapFocusPoint, useMapActions } from "../store/useMapStore";
import { Work } from "../types";
import { useMovimentoReduzido } from "@/shared/hooks/useMovimentoReduzido";
import { voar, voarParaLimites, ZOOM_MIN_MUNICIPIOS } from "../utils/mapUtils";

interface MapEffectProps {
  setIsFocused: (v: boolean) => void;
  setCoropletico: (v: boolean) => void;
  works: Work[];
}

// Zoom máximo ao enquadrar uma seleção ou filtro: 15 mostra o bairro; 18 era nível de rua
const ZOOM_MAX_ENQUADRAMENTO = 15;
// Retângulo aproximado de Mato Grosso para a visão geral do Estado
const LIMITES_MT = L.latLngBounds([
  [-18.05, -61.65],
  [-7.35, -50.2],
]);
const zoomEstado = (map: L.Map) =>
  Math.min(map.getBoundsZoom(LIMITES_MT) - 0.5, ZOOM_MIN_MUNICIPIOS - 0.25);

// Meio nível mais afastado que o enquadramento justo (o cabeçalho e a barra de KPIs cobrem as bordas
// do mapa), e sempre abaixo de ZOOM_MIN_MUNICIPIOS: a visão geral é sempre coroplética
const verEstado = (map: L.Map, reduzido: boolean) =>
  voar(map, LIMITES_MT.getCenter(), zoomEstado(map), reduzido);

export const MapEffect = ({ setIsFocused, setCoropletico, works }: MapEffectProps) => {
  const map = useMap();
  const selectedWork = useSelectedWork();
  const mapFocusPoint = useMapFocusPoint();
  const { closeDetail } = useMapActions();
  const reduzido = useMovimentoReduzido();

  // Refs para controle de estado interno sem renderização
  const previousWorksIdsRef = useRef<string>("");
  const previousWorksCountRef = useRef(0);

  // Esta ref serve como barreira para impedir o fitBounds no primeiro carregamento
  const isFirstLoadRef = useRef(true);

  // --- Efeito 0: Inicialização (Starting Point) ---
  useEffect(() => {
    // Começa no coroplético com o Estado inteiro à vista (sem voo: é o primeiro quadro)
    map.setView(LIMITES_MT.getCenter(), zoomEstado(map));
  }, [map]);

  // --- Efeito 0b: abaixo de ZOOM_MIN_MUNICIPIOS o mapa é coroplético (CamadaMunicipios); acima, bolhas.
  // As legendas acompanham as bolhas; as que se atropelam são escondidas por ColisaoLegendas ---
  useEffect(() => {
    const atualizarRotulos = () => {
      const classes = map.getContainer().classList;
      classes.toggle("mostra-municipios", map.getZoom() >= ZOOM_MIN_MUNICIPIOS);
      setCoropletico(map.getZoom() < ZOOM_MIN_MUNICIPIOS);
    };
    atualizarRotulos();
    map.on("zoomend", atualizarRotulos);
    return () => {
      map.off("zoomend", atualizarRotulos);
    };
  }, [map, setCoropletico]);

  // --- Efeito 1: Seleção de Obra ou Ponto de Foco ---
  useEffect(() => {
    // Centraliza no ponto deslocado 20% da largura, para o card da obra não cobri-lo
    const voarDeslocado = ({ lat, lng }: { lat: number; lng: number }) => {
      const centro = map.project([lat, lng], ZOOM_MAX_ENQUADRAMENTO).add([map.getSize().x * 0.2, 0]);
      voar(map, map.unproject(centro, ZOOM_MAX_ENQUADRAMENTO), ZOOM_MAX_ENQUADRAMENTO, reduzido);
    };

    // Caso 1: Navegação para um ponto específico (ex: clique em foto)
    if (mapFocusPoint) {
      voarDeslocado(mapFocusPoint);
      setIsFocused(true);
      return;
    }

    // Caso 2: Obra selecionada
    if (selectedWork) {
      setIsFocused(false);

      // Com trechos, enquadra todos; senão, o ponto único
      const bounds = L.latLngBounds([...(selectedWork.routes ?? []), ...(selectedWork.geoTrechos ?? [])].flat());
      if (bounds.isValid()) {
        voarParaLimites(
          map,
          bounds.pad(0.1),
          {
            paddingTopLeft: [20, 20],
            paddingBottomRight: [map.getSize().x * 0.35 + 20, 20],
            maxZoom: ZOOM_MAX_ENQUADRAMENTO,
          },
          reduzido,
        );
      } else if (selectedWork.location) {
        voarDeslocado(selectedWork.location);
      }
      setIsFocused(true);
    } else {
      setIsFocused(false);
    }
  }, [selectedWork, map, setIsFocused, mapFocusPoint, reduzido]);

  // --- Efeito 2: Monitoramento de Filtros (works) ---
  useEffect(() => {
    // Gera ID único da lista atual para comparação
    const currentWorksIds = works.map((w) => w.id).sort().join(",");
    const hasChanged = previousWorksIdsRef.current !== currentWorksIds;
    // Filtro afrouxado (ex.: "Limpar filtros"): reenquadra mesmo com pontos visíveis, senão o mapa
    // ficava no zoom do município anterior
    const cresceu = works.length > previousWorksCountRef.current;

    // Atualiza o cache de IDs
    previousWorksIdsRef.current = currentWorksIds;
    previousWorksCountRef.current = works.length;

    // LÓGICA DO STARTING POINT:
    // Se for o primeiro carregamento de dados (isFirstLoadRef é true),
    // nós NÃO ajustamos o zoom. Apenas marcamos que o load inicial ocorreu.
    if (isFirstLoadRef.current) {
      // Se works vier vazio, ainda consideramos "loading" ou "estado inicial vazio".
      // Se works > 0, consideramos que os dados chegaram.
      if (works.length > 0) {
        isFirstLoadRef.current = false;
      }
      // Retorna aqui para manter o mapa em Cuiabá (definido no Efeito 0)
      return;
    }

    // Se os dados não mudaram desde a última renderização, não faz nada
    if (!hasChanged) return;

    // Verifica integridade da obra selecionada após filtro
    if (selectedWork) {
      const selectedWorkStillExists = works.some((w) => w.id === selectedWork.id);
      if (!selectedWorkStillExists) {
        closeDetail();
      } else {
        return; // Mantém o foco na obra selecionada se ela ainda existir
      }
    }

    // Se o filtro resultou em zero obras, volta para visão geral do Estado
    if (works.length === 0) {
      verEstado(map, reduzido);
      return;
    }

    // --- Ajuste de Zoom para os Filtros (FitBounds) ---
    const bounds = L.latLngBounds([]);

    // Calcula bounds e verifica se existe ao menos um ponto visível
    const currentBounds = map.getBounds();
    let anyVisible = false;

    works.forEach((work) => {
      if (work.location) {
        const p = L.latLng(work.location.lat, work.location.lng);
        bounds.extend(p);
        if (currentBounds.contains(p)) anyVisible = true;
      }
    });

    // Regra simples: ao restringir o filtro, se houver ao menos um ponto visível na vista atual,
    // não movemos o mapa. Reencaixamos se nenhum ponto estiver visível ou se o filtro afrouxou.
    if (anyVisible && !cresceu) {
      return;
    }

    if (bounds.isValid()) {
      voarParaLimites(
        map,
        bounds,
        {
          paddingTopLeft: [450, 150],     // Ajuste conforme sua UI
          paddingBottomRight: [450, 100], // Ajuste conforme sua UI
          maxZoom: ZOOM_MAX_ENQUADRAMENTO,
        },
        reduzido,
      );
    }
  }, [works, map, selectedWork, closeDetail, reduzido]);

  return null;
};
