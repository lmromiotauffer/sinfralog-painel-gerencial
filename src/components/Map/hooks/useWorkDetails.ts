import { useMemo } from "react";
import { useTable } from "@cluster-data-experience/qlik-modules";
import { safeQNum } from "@/shared/utils/safeQNum";
import { parsePonto } from "../utils/mapUtils";

export interface WorkDetails {
  id: string;
  contract: string;
  description: string;
  workType: string;
  status: string;
  executionEndDate: string;
  workValue: number;
  execution: number;
  expectedExecution: number;
  routes?: [number, number][][];
  geoTrechos?: [number, number][][];
  siglaRodovia?: string;
}


export interface WorkPhoto {
  url: string;
  location: { lat: number; lng: number } | null;
  date: string;
  service: string;
}

interface UseWorkDetailsConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detailsColumns?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photoColumns?: any[];
}



export const useWorkDetails = (config?: UseWorkDetailsConfig) => {
  // Fetch details data - Qlik already filters by selected work
  const { data: detailsData } = useTable({
    columns: config?.detailsColumns || [],
    pageHeight: 1, // Only need one row for details
  });

   


  // Fetch photos data -> Qlik retorna no maximo 10 mil celulas por requisição
  const { data: photosData } = useTable({
    columns: config?.photoColumns || [],
    pageHeight: 1000,
  });



  // Parse details for the selected work (Qlik already filters the data)
  const workDetails = useMemo<WorkDetails | null>(() => {

    if (!detailsData?.rows || detailsData.rows.length === 0) {
      return null;
    }
     

      // Get the first row - Qlik already filtered to the selected work
    const row = detailsData.rows[0];

    // Columns order (from mapDetails.detailsColumns):
    // 0: _skObra (ID)
    // 1: Contract
    // 2: Work description
    // 3: Work type
    // 4: Work classification
    // 5: Current status
    // 6: Execution end date
    // 7: Work value (measure)
    // 8: % Execution (measure)
    // 9: % Expected execution (measure)
    // 10: Trecho (measure)
    // 11: GeoTrecho (measure)

    const parseGeoJson = (raw: string | undefined): [number, number][][] | undefined => {
      if (!raw || raw === "-" || !raw.startsWith("[")) return undefined;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if it's an array of segments: [[[lng, lat], ...], [[lng, lat], ...]]
          if (Array.isArray(parsed[0]) && Array.isArray(parsed[0][0])) {
            return parsed.map((segment: [number, number][]) =>
              segment.map((coord: [number, number]) => [coord[1], coord[0]]),
            );
          }
          // Check if it's a single segment: [[lng, lat], [lng, lat], ...]
          else if (Array.isArray(parsed[0]) && typeof parsed[0][0] === "number") {
            return [
              parsed.map((coord: [number, number]) => [coord[1], coord[0]]),
            ];
          }
          // Check if it's a single point: [lng, lat]
          else if (typeof parsed[0] === "number" && parsed.length === 2) {
            return [[[parsed[1], parsed[0]]]];
          }
        }
      } catch {
        return undefined;
      }
      return undefined;
    };

    const routes       = parseGeoJson(row.cells[10]?.qText);
    const geoTrechos   = parseGeoJson(row.cells[11]?.qText);
    const siglaRodovia = row.cells[12]?.qText || "";

  

    return {
      id: row.cells[0]?.qText || "",
      contract: row.cells[1]?.qText || "",
      description: row.cells[2]?.qText || "",
      workType: row.cells[3]?.qText || "",
      status: row.cells[5]?.qText || "",
      executionEndDate: row.cells[6]?.qText || "",
      workValue: safeQNum(row.cells[7]?.qNum),
      // qNum comes as decimal (0-1), multiply by 100 to get percentage
      execution: Math.round(safeQNum(row.cells[8]?.qNum) * 100),
      expectedExecution: Math.round(safeQNum(row.cells[9]?.qNum) * 100),
      routes,
      geoTrechos,
      siglaRodovia,
    };
  }, [detailsData]);

  // Parse photos for the selected work
  // Since we use selectCell on _skObra, Qlik will filter the photos automatically
  const workPhotos = useMemo<WorkPhoto[]>(() => {
    if (!photosData?.rows) {
      return [];
    }

    // Columns order (from mapDetails.photoColumns):
    // 0: urlFoto (dimension)
    // 1: localFoto (dimension) - formato: "[lng,lat]" ou "-"
    // 2: dataFotoDiarioObra (dimension)
    // 3: nmServicoFoto (dimension)
    // 4: medida de filtro (measure)
    return (
      photosData.rows
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((row: any) => {
          const url = row.cells[0]?.qText || "";
          const date = row.cells[2]?.qText || "";
          const service = row.cells[3]?.qText || "";

          const location = parsePonto(row.cells[1]?.qText) ?? null;

          return {
            url,
            location,
            date,
            service,
          };
        })
        .filter((photo: WorkPhoto) => photo.url && photo.url !== "-")
    );
  }, [photosData]);

  return { workDetails, workPhotos };
};
