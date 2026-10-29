import type { FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import polylabel from "polylabel";
import municipiosMT from "../data/municipios-mt.json";

const colecao = municipiosMT as FeatureCollection<Polygon | MultiPolygon, { nome: string }>;

// Só o anel externo de cada polígono; buracos são irrelevantes para município
export const municipios = colecao.features.map((feature) => {
  const aneis =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates[0]]
      : feature.geometry.coordinates.map((poligono) => poligono[0]);
  const pontos = aneis.flat();
  // Polo de inacessibilidade do maior anel: centro do maior círculo inscrito, onde o rótulo cabe melhor.
  // Precisão em graus (~500 m)
  const polo = aneis
    .map((anel) => polylabel([anel as [number, number][]], 0.005))
    .reduce((melhor, candidato) => (candidato.distance > melhor.distance ? candidato : melhor));
  return {
    nome: feature.properties.nome,
    aneis,
    polo: { lat: polo[1], lng: polo[0] },
    minLng: Math.min(...pontos.map((p) => p[0])),
    maxLng: Math.max(...pontos.map((p) => p[0])),
    minLat: Math.min(...pontos.map((p) => p[1])),
    maxLat: Math.max(...pontos.map((p) => p[1])),
  };
});

// Ray casting clássico: conta cruzamentos de uma semirreta horizontal com as arestas do anel
export const dentroDoAnel = (anel: Position[], lng: number, lat: number): boolean => {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
};

export const municipioDoPonto = (lat: number, lng: number): string | undefined =>
  municipios.find(
    (m) =>
      lng >= m.minLng &&
      lng <= m.maxLng &&
      lat >= m.minLat &&
      lat <= m.maxLat &&
      m.aneis.some((anel) => dentroDoAnel(anel, lng, lat)),
  )?.nome;
