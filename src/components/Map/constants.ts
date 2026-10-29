const normalizeCategory = (category: string): string => {
  return category
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();
};

type CategoryColors = { base: string; light: string };

// Cores por categoria: base (também para mapas claros) e clara (para mapas escuros).
// Paleta de dados: matizes distintos com luminosidades escalonadas, separáveis com daltonismo (ΔE ≥ 9).
// Base ≥ 3,6:1 sobre fundo claro; clara ≥ 5:1 sobre fundo escuro e com o texto escuro dos badges.
// Chaves normalizadas para garantir match
const CATEGORY_COLORS: Record<string, CategoryColors> = Object.fromEntries(
  Object.entries({
    'Infraestrutura Aeroportuária': { base: '#1186b8', light: '#cdebfd' },
    'Infraestrutura Rodoviária': { base: '#813900', light: '#fdab7d' },
    'Infraestrutura Urbana': { base: '#6d4bb4', light: '#c2adff' },
    'Obra Civil': { base: '#8c7506', light: '#fadf74' },
    'Obras de Arte Especiais/Correntes': { base: '#015d4c', light: '#53e0c0' },
    'Pavimentação Urbana': { base: '#c14f8c', light: '#d577a6' },
  }).map(([key, value]) => [normalizeCategory(key), value])
);

const DEFAULT_COLORS: CategoryColors = { base: '#6b7280', light: '#c2c8d2' };

// Posição da categoria na ordem da paleta (para ordenar listas); desconhecidas por último
export const indiceCategoria = (category: string): number => {
  const chaves = Object.keys(CATEGORY_COLORS);
  const indice = chaves.indexOf(normalizeCategory(category));
  return indice === -1 ? chaves.length : indice;
};

// Retorna as variantes de cor de uma categoria
export const getCategoryColors = (category: string): CategoryColors =>
  (category && CATEGORY_COLORS[normalizeCategory(category)]) || DEFAULT_COLORS;

// Retorna a cor apropriada baseada no tema (isDark = true retorna a clara para contrastar no fundo escuro)
export const getCategoryColorForTheme = (category: string, isDark: boolean): string => {
  const colors = getCategoryColors(category);
  return isDark ? colors.light : colors.base;
};

// Chave gratuita obrigatória para os basemaps do CARTO (https://carto.com/basemaps/apikey);
// sem ela os tiles vêm com a marca-d'água "API KEY REQUIRED"
const CARTO_API_KEY = 'cb1_2qdb_1_5f7018202e01df2eaee90ed9';
const CARTO_KEY_PARAM = `?key=${CARTO_API_KEY}`;

export const MAP_LAYERS = {
  // Voyager tem labels mais legíveis que dark_all/light_all
  dark: `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png${CARTO_KEY_PARAM}`,
  light: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png${CARTO_KEY_PARAM}`,
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

// Variantes sem rótulos de cidade, usadas no coroplético para não concorrer com os nomes dos municípios.
// OSM e Esri não têm variante; caem na camada normal.
export const MAP_LAYERS_SEM_ROTULOS: Partial<typeof MAP_LAYERS> = {
  dark: `https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png${CARTO_KEY_PARAM}`,
  light: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png${CARTO_KEY_PARAM}`,
};
