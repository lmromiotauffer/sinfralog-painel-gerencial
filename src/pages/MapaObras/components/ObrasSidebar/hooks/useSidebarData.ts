import { useMemo, useState, useEffect, useCallback } from "react";
import { useTable } from "@cluster-data-experience/qlik-modules";
import { municipioDoPonto } from "@/components/Map/utils/municipios";
import { parsePonto } from "@/components/Map/utils/mapUtils";
import { nomeCurtoObra } from "@/components/Map/utils/nomeObra";
import { safeQNum } from "@/shared/utils/safeQNum";
import { celulasOrdemEngine } from "@/shared/utils/celulasOrdemEngine";
import { mesclarPaginaObras } from "./mesclarPaginaObras";

export interface SidebarObra {
  id: string;
  contrato: string;
  /** Nome curto da obra (descrição até o primeiro " - "); vazio quando não há descrição */
  nome: string;
  municipio?: string;
  tipoObra: string;
  execucao: number;
  valor: number;
  fotoUrl?: string;
  /** Serial de data do Qlik (dias), só para ordenar */
  dataConclusao?: number;
  codigoObra: string;
}

export type SortField = "tipo" | "execucao" | "dataConclusao";
export type SortOrder = "asc" | "desc";

const PAGE_SIZE = 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSidebarData = (config?: any) => {

  const [accumulatedObras, setAccumulatedObras] = useState<SidebarObra[]>([]);

  const table = useTable({
    columns: config?.columns || [],
    pageHeight: PAGE_SIZE,
  });

  
  const { data, layout, isLoading, isFetching, getNextPage, currentPage, hasMoreData } =
    table;

  // Parse obras from current page
  const currentPageObras = useMemo<SidebarObra[]>(() => {

    if (!data || !data.rows) {
      return [];
    }

    // Use Map to deduplicate by _skObra (work ID)
    const obrasMap = new Map<string, SidebarObra>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.rows.forEach((row, index: number) => {
      // IMPORTANT: Qlik orders cells as DIMENSIONS FIRST, then MEASURES
      // Dimensions (appear first in cells): _skObra (0), Contrato (1), Tipo da obra (2), cdLote (3), Local da obra (4)
      // Measures (appear after dimensions): Foto (5), Execução (6), Data fim execução (7), Valor (8)
      //
      // In row.cells (DIMENSIONS FIRST, then MEASURES):
      // cells[0] = _skObra (dimension 0)
      // cells[1] = Contrato (dimension 1)
      // cells[2] = Tipo da obra (dimension 2)
      // cells[3] = cdLote (dimension 3)
      // cells[4] = Local da obra (dimension 4)
      // cells[5] = MaxString(urlFoto) (measure 0)
      // cells[6] = Execução (measure 1)
      // cells[7] = Date(Data fim execução da obra) (measure 2)
      // cells[8] = Sum(valorServicoObra) (measure 3)
      // cells[9] = Only(Descrição da obra) (measure 4)
      const cells = celulasOrdemEngine(row.cells, layout?.qHyperCube);
      const id = cells[0]?.qText || `obra-${index}`;

      // Skip if we already have this work (deduplicate)
      if (obrasMap.has(id)) {
        return;
      }

      const contrato = cells[1]?.qText || "-";
      const tipoObra = cells[2]?.qText || "Outros";
      const codigoObra = cells[3]?.qText || "";
      const fotoUrlCell = cells[5];
      // Verificar se a célula tem foto: não é nula e não é o valor padrão '-'
      const fotoUrl =
        fotoUrlCell?.qIsNull === false && fotoUrlCell?.qText !== "-"
          ? fotoUrlCell?.qText
          : undefined;
      const execucao = Math.round(safeQNum(cells[6]?.qNum) * 100);
      const dataFimCell = cells[7];
      const valorCell = cells[8];

      // Extrair valor numérico usando safeQNum
      const valor = safeQNum(valorCell?.qNum);
      // Date() no Qlik é dual: qNum é o serial do dia, que já ordena; NaN (sem data) vira undefined
      const dataConclusao = dataFimCell?.qIsNull === false ? Number(dataFimCell.qNum) || undefined : undefined;
      const descricao = cells[9]?.qText;
      const nome = descricao && descricao !== "-" ? nomeCurtoObra(descricao) : "";

      // "Local da obra" é a coordenada "[lng, lat]"; o município sai do polígono que a contém
      const ponto = parsePonto(cells[4]?.qText);
      const municipio = ponto && municipioDoPonto(ponto.lat, ponto.lng);

      obrasMap.set(id, {
        id,
        contrato,
        nome,
        municipio,
        tipoObra,
        execucao,
        valor,
        fotoUrl,
        dataConclusao,
        codigoObra,
      });
    });

    return Array.from(obrasMap.values());
  }, [data, layout]);

  // A lib volta a qTop 0 a cada layout novo (filtro): a 1ª página troca a lista, as seguintes acrescentam
  const qTop = currentPage?.qTop || 0;
  useEffect(() => {
    if (!data) return;
    setAccumulatedObras((anteriores) => mesclarPaginaObras(anteriores, currentPageObras, qTop));
  }, [data, currentPageObras, qTop]);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!isFetching && hasMoreData) {
      getNextPage();
    }
  }, [isFetching, hasMoreData, getNextPage]);

  return {
    obras: accumulatedObras,
    isLoading,
    isFetching,
    hasMoreData,
    loadMore,
  };
};
