/**
 * Lista acumulada da lista de obras depois de chegar uma página do Qlik.
 * A 1ª página (qTop 0) chega a cada layout novo, ou seja, a cada filtro: substitui a lista, mesmo vazia.
 * As seguintes (rolagem) só acrescentam as obras que ainda não estão na lista.
 */
export const mesclarPaginaObras = <T extends { id: string }>(anteriores: T[], pagina: T[], qTop: number): T[] => {
  if (qTop === 0) return pagina;
  const ids = new Set(anteriores.map((obra) => obra.id));
  const novas = pagina.filter((obra) => !ids.has(obra.id));
  return novas.length === 0 ? anteriores : [...anteriores, ...novas];
};
