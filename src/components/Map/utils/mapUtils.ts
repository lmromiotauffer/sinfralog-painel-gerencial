import L from 'leaflet';

export const createClusterCustomIcon = function (cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();

  // 60px + 3px por item, até 140px
  const dynamicSize = Math.min(60 + count * 3, 140);

  return L.divIcon({
    html: `<span>${count}</span>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(dynamicSize, dynamicSize, true),
  });
}

// "[lng, lat]" do Qlik → { lat, lng }; undefined quando ausente ("-") ou inválido
export const parsePonto = (raw?: string): { lat: number; lng: number } | undefined => {
  try {
    const coords = JSON.parse(raw ?? "");
    if (Array.isArray(coords) && coords.length === 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
      return { lat: coords[1], lng: coords[0] };
    }
  } catch {
    // formato inválido
  }
  return undefined;
};

// Abaixo deste zoom o mapa é coroplético (CamadaMunicipios); a partir dele, bolhas
export const ZOOM_MIN_MUNICIPIOS = 8;

// Todo deslocamento do mapa é um voo: o Leaflet só anima setView/fitBounds até 4 níveis de zoom e, de
// 6,75 para 15, o usuário perdia a referência de onde estava. Com prefers-reduced-motion, salto seco.
const VOO = { duration: 0.9, easeLinearity: 0.25 };
export const voar = (map: L.Map, centro: L.LatLngExpression, zoom: number, reduzido: boolean) =>
  reduzido ? map.setView(centro, zoom) : map.flyTo(centro, zoom, VOO);
export const voarParaLimites = (map: L.Map, limites: L.LatLngBounds, opcoes: L.FitBoundsOptions, reduzido: boolean) =>
  reduzido ? map.fitBounds(limites, { ...opcoes, animate: false }) : map.flyToBounds(limites, { ...opcoes, ...VOO });

export const intersecta =(a: DOMRect, b: DOMRect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
