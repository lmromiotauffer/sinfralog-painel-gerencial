import { useState, useEffect, useLayoutEffect, useCallback, useRef, lazy, Suspense } from "react";
import { X } from "lucide-react";
import { useIsDetailOpen, useSelectedPhotoIndex, useSelectedWork, useMapActions } from "../../store/useMapStore";
import { useWorkDetails } from "../../hooks/useWorkDetails";
import { getCategoryColorForTheme } from "../../constants";
import { nomeCurtoObra } from "../../utils/nomeObra";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useMobileScreen } from "@/shared/hooks/useMobileScreen";
import { cn } from "@/shared/utils/tailwind/cn";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { ImageGallery } from "./fragments/ImageGallery/ImageGallery";
import { InfoGrid } from "./fragments/InfoGrid";

// Lazy: o echarts só baixa quando uma obra é aberta
const ExecutionChart = lazy(() =>
  import("./fragments/ExecutionChart").then((m) => ({ default: m.ExecutionChart }))
);
import Typography from "@/components/Typography/Typography";
import Card from "@/components/Card/components/Root/Root";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WorkDetail = ({ config }: { config?: any }) => {
    // Mesmo breakpoint do layout e da lista (1024px); as classes de posição abaixo usam lg: pelo mesmo motivo
    const isMobile = useMobileScreen(1024);
    const isDetailOpen = useIsDetailOpen();
    const selectedWork = useSelectedWork();
    const selectedPhotoIndex = useSelectedPhotoIndex();
    const {
      closeDetail,
      setSelectedPhotoIndex,
      setMapFocusPoint,
      atualizarObraSelecionada,
      setWorkPhotos,
    } = useMapActions();
    const { isDark } = useTheme();
    const { workDetails: detalhesQlik, workPhotos } = useWorkDetails({
      detailsColumns: config?.detailsColumns,
      photoColumns: config?.photoColumns,
    });
    // Até o Qlik aplicar a nova seleção os detalhes ainda são da obra anterior: só valem com o mesmo id
    const workDetails = detalhesQlik && detalhesQlik.id === selectedWork?.id ? detalhesQlik : null;

    // Update selected work routes and geoTrechos when details are loaded
    useEffect(() => {
      if (workDetails?.routes) atualizarObraSelecionada({ routes: workDetails.routes });
      if (workDetails?.geoTrechos) {
        atualizarObraSelecionada({ geoTrechos: workDetails.geoTrechos, siglaRodovia: workDetails.siglaRodovia });
      }
    }, [workDetails, atualizarObraSelecionada]);

    // Publica as fotos para os marcadores do mapa (PhotoMarkers), sem abrir uma segunda tabela no Qlik
    useEffect(() => {
      setWorkPhotos(workPhotos);
    }, [workPhotos, setWorkPhotos]);

    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Teclado: Esc fecha; o foco entra no card ao abrir e volta para onde estava ao fechar
    const cardRef = useRef<HTMLDivElement | null>(null);
    const focoAnteriorRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
      if (!isDetailOpen) return;
      focoAnteriorRef.current = document.activeElement as HTMLElement | null;
      const aoTeclar = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeDetail();
      };
      document.addEventListener("keydown", aoTeclar);
      return () => {
        document.removeEventListener("keydown", aoTeclar);
        focoAnteriorRef.current?.focus?.({ preventScroll: true });
      };
    }, [isDetailOpen, closeDetail]);
    useEffect(() => {
      if (isDetailOpen && shouldRender) cardRef.current?.focus({ preventScroll: true });
    }, [isDetailOpen, shouldRender]);

    // Monta/desmonta com animação. useLayoutEffect + @starting-style (variante starting:) fazem o
    // deslize começar no mesmo frame em que a busca recua, sem esperar requestAnimationFrame.
    useLayoutEffect(() => {
      if (isDetailOpen) {
        setShouldRender(true);
        setIsVisible(true);
      } else {
        setIsVisible(false);
        // Wait for animation to complete before unmounting
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isDetailOpen]);

    const color = workDetails ? getCategoryColorForTheme(workDetails.workType, isDark) : "var(--colors-muted-foreground)";

    // Handle photo index change - also move map to photo location
    const handlePhotoIndexChange = useCallback((index: number) => {
      setSelectedPhotoIndex(index);

      // Move map to photo location if available
      const photo = workPhotos[index];
      if (photo?.location) {
        setMapFocusPoint(photo.location);
      }
    }, [workPhotos, setSelectedPhotoIndex, setMapFocusPoint]);

    // Nome da obra no título; o contrato vira subtítulo junto do município
    const descricao = workDetails?.description;
    const nomeObra = descricao && descricao !== "-" ? nomeCurtoObra(descricao) : "";
    const titulo = nomeObra || (workDetails ? `Contrato ${workDetails.contract}` : "");
    const subtitulo = [
      selectedWork?.municipio,
      nomeObra && workDetails ? `Contrato ${workDetails.contract}` : undefined,
    ]
      .filter(Boolean)
      .join(" · ");

    // Don't render if not needed
    if (!shouldRender) return null;

    return (
      <div
        ref={cardRef}
        tabIndex={-1}
        data-revelar="obra"
        role="region"
        aria-label={titulo ? `Detalhes da obra: ${titulo}` : "Detalhes da obra"}
        className={cn(
          isMobile
            ? "fixed bottom-0 left-0 right-0"
            // top-11: começa 8px (gap-2 do layout) abaixo da caixa de busca (h-9 no topo do header), que fica parada
            : "absolute lg:right-2 lg:top-11 lg:bottom-0",
          isMobile
            ? "w-full mx-2 pb-2 pr-4"
            : "lg:px-0 lg:pb-0 lg:w-[546px]",
          // max-h: com zoom 200% (viewport de ~384px) o cabeçalho e o botão de fechar ficavam fora da tela
          isMobile ? "h-[446px] max-h-[calc(100dvh-4rem)]" : "lg:h-auto",
          "overflow-x-hidden outline-none",
          "z-50 lg:z-20 pointer-events-auto",
          // desliza de fora da tela (o contêiner da página tem overflow-hidden); sai mais rápido.
          // Com prefers-reduced-motion só faz fade.
          "transition-[opacity,translate] ease-suave motion-reduce:translate-x-0 motion-reduce:translate-y-0",
          isVisible
            ? cn(
                "translate-x-0 translate-y-0 opacity-100 duration-[400ms] motion-reduce:starting:opacity-0",
                isMobile
                  ? "motion-safe:starting:translate-y-full"
                  : "motion-safe:starting:translate-x-[calc(100%+0.5rem)]",
              )
            : cn(
                "duration-300 motion-reduce:opacity-0",
                isMobile ? "translate-y-full" : "translate-x-[calc(100%+0.5rem)]",
              ),
        )}
      >
        <Card className="flex h-full w-full min-w-0 flex-col overflow-hidden p-3 md:p-4 rounded-b-lg md:rounded-lg">
          {/* Header - Fixed at top. Sem margem própria: o Card já aplica gap-4 entre os filhos */}
          <div className="flex shrink-0 items-start justify-between gap-2">
            {/* key: ao chegar outra obra o bloco remonta e a entrada em foco se repete */}
            <div key={workDetails?.id} data-ordem style={{ "--ordem": 0 } as React.CSSProperties} className="flex min-w-0 flex-1 flex-col">
              <div className="flex min-w-0 items-center gap-2">
                <Typography
                  variant="text-lg"
                  className="truncate font-semibold leading-tight md:text-xl"
                  title={titulo}
                >
                  {titulo}
                </Typography>
                {workDetails && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 rounded px-2 py-0.5 text-xs font-medium"
                  >
                    {workDetails.status || "Situação não informada"}
                  </Badge>
                )}
              </div>
              {subtitulo && (
                <Typography variant="text-xs" className="text-muted-foreground truncate" title={subtitulo}>
                  {subtitulo}
                </Typography>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDetail}
              aria-label="Fechar detalhes da obra"
              className="text-foreground hover:text-foreground -mt-1 -mr-1 h-8 w-8 shrink-0 p-0 hover:bg-transparent"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Conteúdo: o gráfico absorve a altura restante, então em telas ≥ 900px de altura cabe inteiro;
              a rolagem vertical só aparece quando não cabe (telas baixas com filtros ativos, mobile) */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden -mr-2 pr-2 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb:hover]:bg-border">
            <div className="flex flex-col gap-3 h-full">
              {/* Gallery */}
              <ImageGallery
                photos={workPhotos}
                title={workDetails?.description || ""}
                category={workDetails?.workType || ""}
                color={color}
                currentIndex={selectedPhotoIndex}
                onIndexChange={handlePhotoIndexChange}
              />

              {/* Info Grid */}
              {workDetails && (
                <InfoGrid key={workDetails.id} workDetails={workDetails} />
              )}

              {/* Gráfico: único bloco elástico, ocupa o que sobrar */}
              <div className="min-h-[160px] flex-1">
                <Suspense fallback={null}>
                  <ExecutionChart
                    color={color}
                    columns={config?.detailsLineChart?.columns}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
};
