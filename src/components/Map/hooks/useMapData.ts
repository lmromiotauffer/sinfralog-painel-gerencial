import { useEffect, useMemo, useState } from "react";
import { useTable, type Cell } from "@cluster-data-experience/qlik-modules";
import type { Work } from "../types";
import { municipioDoPonto } from "../utils/municipios";
import { nomeCurtoObra } from "../utils/nomeObra";
import { parsePonto } from "../utils/mapUtils";
import { celulasOrdemEngine } from "@/shared/utils/celulasOrdemEngine";
import { paginasExportacao } from "@/shared/components/CustomTable/exportarPlanilha";
import { safeQNum } from "@/shared/utils/safeQNum";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useMapData = (config?: any) => {
  const table = useTable({
    columns: config?.columns || [],
    pageHeight: 1000,
  });

  const { data, layout, isLoading, isFetching, getDataPage } = table;

  // A lib só traz a 1ª página: as linhas além dela vêm aqui, marcadas com o layout de origem para
  // linhas de um filtro antigo nunca se misturarem às do atual
  const [linhasExtras, setLinhasExtras] = useState<{ layout: unknown; linhas: Cell[][] }>({ layout: null, linhas: [] });
  useEffect(() => {
    const cubo = layout?.qHyperCube;
    const total = cubo?.qSize?.qcy ?? 0;
    const qcx = cubo?.qSize?.qcx ?? 0;
    const carregadas = cubo?.qDataPages?.[0]?.qMatrix?.length ?? 0;
    if (!layout || !qcx || total <= carregadas) return;
    let ativo = true;
    (async () => {
      const linhas: Cell[][] = [];
      // Em sequência, como na exportação: um pedido por vez no socket
      for (const pagina of paginasExportacao(total, qcx, carregadas)) {
        const resposta = ((await getDataPage([pagina], "S")) ?? []) as EngineAPI.INxDataPage[];
        if (!ativo) return;
        linhas.push(...resposta.flatMap((p) => p.qMatrix as unknown as Cell[][]));
      }
      setLinhasExtras({ layout, linhas });
    })().catch((erro) => console.warn("[useMapData] Erro ao buscar as obras além da 1ª página:", erro));
    return () => {
      ativo = false;
    };
  }, [layout, getDataPage]);

  // Parse works from Qlik data
  const works = useMemo<Work[]>(() => {
    if (!data || !data.rows) {
      return [];
    }

    const extras = linhasExtras.layout === layout ? linhasExtras.linhas : [];
    const linhas = [...data.rows.map((row) => row.cells), ...extras];

    // Use Map to deduplicate by _skObra (work ID)
    const worksMap = new Map<string, Work>();

    linhas.forEach((celulas, index: number) => {
      const cells = celulasOrdemEngine(celulas, layout?.qHyperCube);
      // IMPORTANT: Qlik orders cells as DIMENSIONS FIRST, then MEASURES
      // JSON column order: _skObra, Tipo, Contrato, cdLote, Local, Execução, Valor, Foto, Descrição
      // Dimensions: _skObra (0), Tipo (1), Contrato (2), cdLote (3), Local (4)
      // Measures: Execução (5), Valor (6), Foto (7), Descrição da obra (8)
      //
      // In row.cells (DIMENSIONS FIRST):
      // cells[0] = _skObra (dimension 0)
      // cells[1] = Tipo da obra (dimension 1)
      // cells[2] = Contrato (dimension 2)
      // cells[3] = cdLote (dimension 3)
      // cells[4] = Local da obra (dimension 4)
      // cells[5] = Execução (measure 0)
      // cells[6] = Valor (measure 1)
      // cells[7] = Foto (measure 2)
      // cells[8] = Descrição da obra (measure 3)

      const id = cells[0]?.qText || `work-${index}`;

      // Skip if we already have this work (deduplicate)
      if (worksMap.has(id)) {
        return;
      }

      const category = cells[1]?.qText || "Outros";
      const contractNumber = cells[2]?.qText || "-";
      const codigoObra = cells[3]?.qText || undefined;
      const fotoUrl = cells[7]?.qText || undefined;
      const descricao = cells[8]?.qText;
      const title = (descricao && descricao !== "-" && nomeCurtoObra(descricao)) || id;

      // Parse location from cells[4] (Local da obra) - specific point for the bubble
      const location = parsePonto(cells[4]?.qText);

      // cells[5] = Execução (measure 0) - percentage
      // cells[6] = Valor (measure 1) - used for bubble size
      const executionPercentage = Math.round(
        safeQNum(cells[5]?.qNum) * 100,
      );
      const value = safeQNum(cells[6]?.qNum);

      // Calculate size factor based on fixed range 0 to 100M
      const CAP_VALUE = 100000000; // 100 milhões

      // Calculate ratio (0 to 1)
      const ratio = Math.min(1, Math.max(0, value) / CAP_VALUE);

      // Use Square Root scale to make smaller values grow faster visually
      // This helps distinguish values in the 0-10M range better than linear
      // Example:
      // 1M (ratio 0.01) -> factor 0.1 (size ~72px)
      // 10M (ratio 0.1) -> factor 0.31 (size ~98px)
      const sizeFactor = Math.sqrt(ratio);

      // Calculate pixel size
      const minSize = 70;
      const maxSize = 140;
      const size = minSize + sizeFactor * (maxSize - minSize);

      const municipio = location ? municipioDoPonto(location.lat, location.lng) : undefined;

      worksMap.set(id, {
        id,
        title,
        category,
        contractNumber,
        codigoObra,
        fotoUrl,
        location,
        municipio,
        size,
        executionPercentage,
      });
    });

    return Array.from(worksMap.values());
  }, [data, layout, linhasExtras]);

  return {
    works,
    loading: isLoading,
    isFetching,
  };
};
