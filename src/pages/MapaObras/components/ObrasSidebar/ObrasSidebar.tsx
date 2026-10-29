import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/tailwind/cn";
import { useMobileScreen } from "@/shared/hooks/useMobileScreen";
import { useMapStore } from "@/components/Map/store/useMapStore";
import type { Work } from "@/components/Map/types";
import { SidebarHeader } from "./fragments/SidebarHeader";
import { ObrasList } from "./fragments/ObrasList";
import { MobileDrawer } from "./fragments/MobileDrawer";
import { TypeFiltersAccordion } from "./fragments/TypeFiltersAccordion";
import { SortControls } from "./fragments/SortControls";
import { useSidebarData, type SidebarObra, type SortField, type SortOrder } from "./hooks/useSidebarData";
import { useTypeFilters } from "./hooks/useTypeFilters";
import { indiceCategoria } from "@/components/Map/constants";

interface ObrasSidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  selectedObraId?: string | null;
  isExpanded?: boolean;
  /** Largura em transição: conteúdo fica oculto para não refluir durante a animação */
  larguraAnimando?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

// Desliga o estado de animação depois de 600ms: 250ms de animação + até 8 × 30ms de cascata
const useDesligarApos = <T,>(valor: T, definir: (v: T) => void, desligado: T) =>
  useEffect(() => {
    if (!valor) return;
    const timer = setTimeout(() => definir(desligado), 600);
    return () => clearTimeout(timer);
  }, [valor, definir, desligado]);

export const ObrasSidebar = ({
  config,
  selectedObraId,
  isExpanded = false,
  larguraAnimando = false,
  onToggleExpand,
  className,
}: ObrasSidebarProps) => {
  // Mesmo breakpoint do layout (wrapper): abaixo de 1024px a lista vira gaveta
  const isMobile = useMobileScreen(1024);
  const { obras, isLoading, isFetching, hasMoreData, loadMore } =
    useSidebarData(config);

  // Pega a config do primeiro filtro (por enquanto só temos um)
  const filterConfig = config?.filterColumns?.[0];
  const { types, toggleType, title: filterTitle, isLoading: typesLoading, clearFilters } = useTypeFilters(filterConfig);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // State para drawer no mobile
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleObraSelect = (obra: SidebarObra) => {
    const { works, selectWork } = useMapStore.getState();
    // A obra do mapa traz localização e trechos; sem ela (fora do mapa), monta uma a partir da lista
    const work: Work = works.find((w) => w.id === obra.id) ?? {
      id: obra.id,
      title: obra.nome || obra.codigoObra || obra.id,
      category: obra.tipoObra,
      contractNumber: obra.contrato,
      codigoObra: obra.codigoObra,
      fotoUrl: obra.fotoUrl,
      location: undefined,
      municipio: obra.municipio,
      size: 0,
      executionPercentage: obra.execucao,
    };

    selectWork(work);

    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };
  const [sortField, setSortField] = useState<SortField>("dataConclusao");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Ordenação local: com foto primeiro, depois pelo campo escolhido
  const sortedObras = useMemo(() => {
    const sinal = sortOrder === "asc" ? 1 : -1;
    const comparadores: Record<SortField, (a: SidebarObra, b: SidebarObra) => number> = {
      // Mesma categoria: por código, sempre crescente
      tipo: (a, b) =>
        sinal * (indiceCategoria(a.tipoObra) - indiceCategoria(b.tipoObra)) ||
        (a.codigoObra || a.id).localeCompare(b.codigoObra || b.id),
      execucao: (a, b) => sinal * (a.execucao - b.execucao),
      // Sem data de conclusão: sempre por último
      dataConclusao: (a, b) => {
        if (a.dataConclusao === undefined || b.dataConclusao === undefined) {
          return Number(a.dataConclusao === undefined) - Number(b.dataConclusao === undefined);
        }
        return sinal * (a.dataConclusao - b.dataConclusao);
      },
    };
    return [...obras].sort(
      (a, b) => Number(!a.fotoUrl) - Number(!b.fotoUrl) || comparadores[sortField](a, b),
    );
  }, [obras, sortField, sortOrder]);

  // Reordenar dispara a cascata no sentido da nova ordem (só quando algo muda de fato)
  const [ordenando, setOrdenando] = useState<SortOrder | null>(null);
  const reordenar = (campo: SortField, ordem: SortOrder) => {
    if (campo === sortField && ordem === sortOrder) return;
    setSortField(campo);
    setSortOrder(ordem);
    setOrdenando(ordem);
  };
  useDesligarApos(ordenando, setOrdenando, null);

  // Cards se desdobram só quando a nova largura assenta: nunca no scroll nem no primeiro carregamento
  const [larguraAnterior, setLarguraAnterior] = useState(larguraAnimando);
  const [revelando, setRevelando] = useState(false);
  if (larguraAnterior !== larguraAnimando) {
    setLarguraAnterior(larguraAnimando);
    setRevelando(!larguraAnimando);
  }
  useDesligarApos(revelando, setRevelando, false);

  const sidebarContent = (
    <>
      {!typesLoading && types.length > 0 && (
        <TypeFiltersAccordion
          types={types}
          title={filterTitle}
          isOpen={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          onTypeChange={toggleType}
          onClearFilters={clearFilters}
        />
      )}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : (
        <ObrasList
          obras={sortedObras}
          selectedObraId={selectedObraId}
          onObraClick={handleObraSelect}
          isExpanded={isExpanded}
          hasMoreData={hasMoreData}
          isFetching={isFetching}
          onLoadMore={loadMore}
          onToggleExpand={onToggleExpand}
        />
      )}
    </>
  );

  if (isMobile) {
    return (
      <MobileDrawer
        obrasCount={sortedObras.length}
        maisPorCarregar={!!hasMoreData}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        {sidebarContent}
      </MobileDrawer>
    );
  }

  return (
    <div
      className={cn(
        // Só a largura anima; recolher é mais rápido que expandir. Sem transition-none no movimento reduzido:
        // o transitionend da largura é o que devolve o conteúdo (o CSS global já encurta para 0.01ms)
        "bg-sidebar backdrop-blur-custom borda-vidro flex h-full flex-col rounded-lg transition-[width] ease-cor",
        isExpanded ? "w-full duration-250" : "w-60 duration-200",
        className,
      )}
    >
      <SidebarHeader
        title="Lista de Obras"
        onToggleExpand={onToggleExpand}
        isExpanded={isExpanded}
        larguraAnimando={larguraAnimando}
        sortControls={
          <SortControls
            sortField={sortField}
            sortOrder={sortOrder}
            onSortFieldChange={(campo) => reordenar(campo, sortOrder)}
            onSortOrderToggle={(ordem) => reordenar(sortField, ordem)}
          />
        }
      />

      <div
        data-revelar={
          revelando ? (isExpanded ? "grade" : "coluna") : ordenando ? `ordem-${ordenando}` : undefined
        }
        className={cn(
          "flex flex-1 flex-col overflow-hidden",
          larguraAnimando
            ? "opacity-0 transition-none"
            : "opacity-100 transition-opacity duration-150 motion-reduce:transition-none",
        )}
      >
        {sidebarContent}
      </div>
    </div>
  );
};
