import { useMemo } from "react";
import { useTable } from "@cluster-data-experience/qlik-modules";
import { safeQNum } from "@/shared/utils/safeQNum";

interface UseExecutionChartConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns?: any[];
}

// qNum decimal (0-1) → porcentagem; null quando não há dado válido (gap no gráfico)
const toPercent = (value: unknown): number | null => {
  const num = safeQNum(value, NaN);
  return Number.isNaN(num) ? null : num * 100;
};

export const useExecutionChart = (config?: UseExecutionChartConfig) => {
  const { data, isLoading } = useTable({
    columns: config?.columns || [],
    pageHeight: 100,
  });

  const { dates, predicted, realized } = useMemo(() => {
    // Columns order (from detailsLineChart.columns):
    // 0: DEANOMES (dimension - date)
    // 1: Previsto (cronograma) (measure)
    // 2: Realizado (medição) (measure)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = data?.rows ?? [];
    return {
      dates: rows.map((row) => row.cells[0]?.qText || ""),
      predicted: rows.map((row) => toPercent(row.cells[1]?.qNum)),
      realized: rows.map((row) => toPercent(row.cells[2]?.qNum)),
    };
  }, [data]);

  return {
    dates,
    predicted,
    realized,
    loading: isLoading,
    hasData: dates.length > 0,
  };
};
