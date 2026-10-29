import { create } from "zustand";
import type { Work } from "../types";
import type { WorkPhoto } from "../hooks/useWorkDetails";

interface MapState {
  // Works list (shared between map and sidebar)
  works: Work[];

  selectedWork: Work | null;
  isDetailOpen: boolean;

  // Fotos e foto selecionada da obra aberta (compartilhadas entre a galeria e os marcadores do mapa)
  workPhotos: WorkPhoto[];
  selectedPhotoIndex: number;

  mapFocusPoint: { lat: number; lng: number } | null;
}

interface MapActions {
  setWorks: (works: Work[]) => void;
  selectWork: (work: Work) => void;
  // Mescla na obra selecionada o que chega depois (trechos e rodovia vindos dos detalhes)
  atualizarObraSelecionada: (campos: Partial<Work>) => void;
  closeDetail: () => void;
  setMapFocusPoint: (point: { lat: number; lng: number } | null) => void;
  setWorkPhotos: (fotos: WorkPhoto[]) => void;
  setSelectedPhotoIndex: (index: number) => void;
}

// A seleção de _skObra/vObraSelecionada no Qlik acompanha selectedWork por um efeito em MapaObras
export const useMapStore = create<MapState & MapActions>((set) => ({
  works: [],
  selectedWork: null,
  isDetailOpen: false,
  workPhotos: [],
  selectedPhotoIndex: 0,
  mapFocusPoint: null,

  setWorks: (works) => set({ works }),

  selectWork: (work) =>
    set({
      selectedWork: work,
      isDetailOpen: true,
      selectedPhotoIndex: 0,
      mapFocusPoint: work.location, // Navigate to the work location
    }),

  atualizarObraSelecionada: (campos) =>
    set((s) => (s.selectedWork ? { selectedWork: { ...s.selectedWork, ...campos } } : {})),

  closeDetail: () => set({ selectedWork: null, isDetailOpen: false, selectedPhotoIndex: 0 }),

  setMapFocusPoint: (point) => set({ mapFocusPoint: point }),

  setWorkPhotos: (fotos) => set({ workPhotos: fotos }),

  setSelectedPhotoIndex: (index) => set({ selectedPhotoIndex: index }),
}));

// Selector hooks for optimized re-renders
export const useSelectedWork = () => useMapStore((state) => state.selectedWork);
export const useIsDetailOpen = () => useMapStore((state) => state.isDetailOpen);
export const useSelectedPhotoIndex = () => useMapStore((state) => state.selectedPhotoIndex);
export const useMapFocusPoint = () =>
  useMapStore((state) => state.mapFocusPoint);

// Action hook - actions are stable, so a non-reactive snapshot is enough
export const useMapActions = () => useMapStore.getState();
