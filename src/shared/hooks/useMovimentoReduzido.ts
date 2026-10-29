import { useConsultaMidia } from "./useConsultaMidia";

const CONSULTA = "(prefers-reduced-motion: reduce)";

/** Preferência do sistema por menos movimento; o CSS já a respeita, este hook é para animações em JS (Leaflet, ECharts, embla). */
export const useMovimentoReduzido = (): boolean => useConsultaMidia(CONSULTA);

export const movimentoReduzido = (): boolean => window.matchMedia(CONSULTA).matches;
