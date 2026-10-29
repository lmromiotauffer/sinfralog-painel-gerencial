import React, { useMemo } from "react";
import { useTable } from "@cluster-data-experience/qlik-modules";
import useFetchJson from "@/shared/hooks/useFetchJson";
import { CustomTable } from "@/shared/components/CustomTable/CustomTable";
import { BarraCarregando } from "@/components/PageLoader/PageLoader";

export const TabelaPagina = ({ jsonUrl }: { jsonUrl: string }) => {
  const [pageHeight, setPageHeight] = React.useState(100);
  const { data: config, isLoading: configLoading } = useFetchJson(jsonUrl);

  const columns = useMemo(() => {
    return config?.table?.columns || [];
  }, [config]);

  const table = useTable({
    columns,
    pageHeight: pageHeight,
    totals: {
      show: true,
      position: "top",
      label: "Totais",
    },
  });

  if (configLoading)
    return (
      <div role="status" aria-label="Carregando tabela" className="flex h-full w-full items-center justify-center text-primary">
        <BarraCarregando />
      </div>
    );

  return (
    <div className="h-full w-full overflow-hidden">
      <CustomTable
        table={table}
        rowsPerPage={pageHeight}
        onRowsPerPageChange={setPageHeight}
        columnsConfig={columns}
      />
    </div>
  );
};
