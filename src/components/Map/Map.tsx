import { MapContent } from "./fragments/MapContent";
import type { MapLayerType, Work } from "./types";
import "./Map.style.css";

interface MapComponentProps {
  currentLayer?: MapLayerType;
  works: Work[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photoColumns?: any[];
  isFetching?: boolean;
}

export const Map = ({ currentLayer = "dark", works, photoColumns, isFetching }: MapComponentProps) => {
  return (
    <div className="relative h-full w-full">
      <MapContent currentLayer={currentLayer} works={works} photoColumns={photoColumns} isFetching={isFetching} />
    </div>
  );
};
