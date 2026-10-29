import type { FilterConfig } from "@/shared/qlik/filtros";

// Rótulos dos campos selecionados fora da barra de filtros (cliques nas tabelas, no mapa e na busca)
const fieldLabels: Record<string, string> = {
  nmServicoFoto: "Serviço da foto",
};

/** Nome do campo numa expressão de filtro: "=[Situação atual do contrato]" vira "Situação atual do contrato" */
export const campoDaExpressao = (expressao: string): string =>
  expressao.replace(/^=/, "").replace(/^\[(.*)\]$/, "$1");

export const getFieldLabel = (field: string, filters: FilterConfig[]): string =>
  filters.find(({ expression }) => campoDaExpressao(expression) === field)?.label ?? fieldLabels[field] ?? field;
