export interface Work {
  id: string;
  /** Nome curto da obra (descrição até o primeiro " - "); cai no id quando não há descrição */
  title: string;
  category: string;
  contractNumber: string;
  codigoObra?: string;
  fotoUrl?: string;
  location?: { lat: number; lng: number };
  municipio?: string;
  size: number;
  executionPercentage: number;
  routes?: [number, number][][];
  geoTrechos?: [number, number][][];
  siglaRodovia?: string;
}

export type MapLayerType = "dark" | "light" | "street" | "satellite";
