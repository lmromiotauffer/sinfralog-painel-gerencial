import { useMemo } from "react";
import ReactECharts from "echarts-for-react/esm/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useTable } from "@cluster-data-experience/qlik-modules";
import { safeQNum } from "@/shared/utils/safeQNum";
import Typography from "@/components/Typography/Typography";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useTheme } from "@/shared/contexts/ThemeContext";

interface ExecutionChartProps {
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns?: any[];
}

// Só os módulos usados: o echarts completo pesa ~1 MB minificado
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

// qNum decimal (0-1) → porcentagem; null quando não há dado válido (gap no gráfico)
const toPercent = (value: unknown): number | null => {
  const num = safeQNum(value, NaN);
  return Number.isNaN(num) ? null : num * 100;
};

export const ExecutionChart = ({ color, columns }: ExecutionChartProps) => {
  const { isDark } = useTheme();
  // O canvas precisa de cores resolvidas; os tokens de cada tema são estáveis
  // mesmo antes de ThemeProvider atualizar a classe do documento.
  const palette = useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const read = (role: string) => styles.getPropertyValue(
      `--palette-${isDark ? "dark" : "light"}-${role}`
    ).trim();
    return { surface: read("surface"), text: read("text"), muted: read("muted"), border: read("border") };
  }, [isDark]);

  const { data, isLoading: loading } = useTable({
    columns: columns || [],
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

  // Sem dataZoom: a série inteira cabe no card; acima de 24 pontos os marcadores encolhem para não se sobrepor
  const tamanhoMarcador = dates.length > 24 ? 5 : 8;

  const chartOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: palette.surface,
        borderColor: palette.border,
        textStyle: { color: palette.text },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any[]) => {
          const date = params[0]?.axisValue || "";
          const lines = params.map(
            (p) => `${p.seriesName}: ${p.value?.toFixed(2) || "-"}%`
          );
          return `<strong>${date}</strong><br/>${lines.join("<br/>")}`;
        },
      },
      grid: {
        left: "0%",
        right: "5%",
        bottom: "0%",
        top: "5%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: dates,
        axisLabel: { color: palette.muted, fontSize: 10 },
        axisLine: {
          show: true,
          lineStyle: { color: palette.border },
        },
        splitLine: {
          show: true,
          lineStyle: { color: palette.border, type: "solid" },
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: palette.muted, fontSize: 10, formatter: "{value}%" },
        splitLine: {
          lineStyle: { color: palette.border, type: "solid" },
        },
        axisLine: {
          show: true,
          lineStyle: { color: palette.border },
        },
        min: 0,
        max: 100,
      },
      series: [
        {
          name: "Realizado",
          type: "line",
          data: realized,
          itemStyle: {
            color: palette.surface,
            borderColor: color,
            borderWidth: 2,
          },
          lineStyle: { width: 3, color },
          symbol: "circle",
          symbolSize: tamanhoMarcador,
          showSymbol: true,
        },
        {
          name: "Previsto",
          type: "line",
          data: predicted,
          itemStyle: {
            color: palette.surface,
            borderColor: palette.muted,
            borderWidth: 2,
          },
          lineStyle: { type: "dashed", width: 2, color: palette.muted },
          symbol: "circle",
          symbolSize: tamanhoMarcador,
          showSymbol: true,
        },
      ],
    }),
    [dates, predicted, realized, color, palette, tamanhoMarcador]
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-2">
        <Skeleton className="h-4 w-48 shrink-0" />
        <Skeleton className="flex-1 w-full min-h-[80px]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between shrink-0">
        <Typography variant="text-sm">
          Previsto (cronograma) x realizado (medição)
        </Typography>
        <ChartLegend color={color} />
      </div>

      {dates.length === 0 ? (
        <div className="text-muted-foreground flex flex-1 w-full items-center justify-center min-h-[80px]">
          <Typography variant="text-sm">Sem dados disponíveis</Typography>
        </div>
      ) : (
        // overflow-hidden: o canvas demora a encolher no resize e não pode inflar o bloco
        <div className="flex-1 w-full min-h-0 overflow-hidden">
          <ReactECharts
            echarts={echarts}
            option={chartOption}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      )}
    </div>
  );
};

const ChartLegend = ({ color }: { color: string }) => (
  <div className="flex gap-3 text-[10px]">
    <div className="flex items-center gap-1.5">
      <div
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: color,
        }}
      />
      <span className="text-muted-foreground font-medium">Realizado</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="border-muted-foreground h-1.5 w-1.5 rounded-full border" />
      <span className="text-muted-foreground font-medium">Previsto</span>
    </div>
  </div>
);
