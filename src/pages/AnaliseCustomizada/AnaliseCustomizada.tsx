import React, { useMemo, useState } from "react";
import useFetchJson from "@/shared/hooks/useFetchJson";
import { CustomTable } from "@/shared/components/CustomTable/CustomTable";
import { Column, useTable } from "@cluster-data-experience/qlik-modules";
import Card from "@/components/Card/components/Root/Root";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/shadcn/sheet";
import { CornerUpLeft, X, Settings } from "lucide-react";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/shadcn/button";

type ColumnExtended = Column & {
  id: string;
};

type ListCardGenericProps = {
  title: string
  items: ColumnExtended[]
  selectedIdsForList: string[]
  onToggle: (id: string) => void
}

const ListCardGeneric = ({ title, items, selectedIdsForList, onToggle }: ListCardGenericProps) => {
  return (
    <Card className="min-h-[120px] md:min-h-[160px] w-full flex-col gap-0 overflow-hidden p-0">
      <div className="text-custom-table-label flex flex-none flex-col lg:flex-row flex-wrap lg:items-center justify-between gap-2 px-3 py-3 border-b border-border min-h-10">
        <Typography variant="text-xs" className="flex-1 text-inherit font-medium">
          {title}
        </Typography>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-0 flex flex-col">
        <div className="h-full overflow-y-auto">
          <div className="flex flex-col gap-3 p-4">
            {items.map((col) => (
              <div key={col.id} className="flex items-center space-x-2">
                <Checkbox id={col.id} checked={selectedIdsForList.includes(col.id)} onCheckedChange={() => onToggle(col.id)} />
                <label htmlFor={col.id} className="text-foreground hover:text-foreground cursor-pointer text-sm font-normal transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {col.type === "dimension" ? col.qFieldLabels?.[0] : col.qLabel}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}


const TableContainer: React.FC<{ columns: ColumnExtended[] }> = ({
  columns,
}) => {
  const [pageHeight, setPageHeight] = useState(100);

  const table = useTable({
    columns,
    pageHeight,
    totals: {
      show: true,
      position: "noTotals",
      label: "Totais",
    },
  });

  const qcy = table.layout?.qHyperCube?.qSize?.qcy ?? 0;
  const conditionLoading = table.isLoading || (!table.data && qcy !== 0);

  if (conditionLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <CustomTable
      table={table}
      className="h-full sm:ml-0"
      rowsPerPage={pageHeight}
      onRowsPerPageChange={setPageHeight}
      columnsConfig={columns}
    />
  );
};

export const AnaliseCustomizada: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data } = useFetchJson("./pages/analise-customizada.json");

  // Memo: selectedColumns vai para o useTable e precisa de referência estável
  const tableColumns = useMemo(() => (data ?? []) as ColumnExtended[], [data]);

  const selectedColumns = useMemo(() => {
    if (!tableColumns.length) return [];

    const selected = selectedIds
      .map((id) => tableColumns.find((col) => col.id === id))
      .filter((col): col is ColumnExtended => !!col);

    const dims = selected.filter((col) => col.type === "dimension");
    const measures = selected.filter((col) => col.type === "measure");

    return [...dims, ...measures];
  }, [tableColumns, selectedIds]);

  const handleCheckboxChange = (columnId: string) => {
    setSelectedIds((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId],
    );
  };

  const dimItems = tableColumns.filter((c) => c.type === "dimension")
  const measureItems = tableColumns.filter((c) => c.type === "measure")

  const panelContent = (
    <>
      <ListCardGeneric
        title="Selecione os agrupamentos"
        items={dimItems}
        selectedIdsForList={selectedIds}
        onToggle={handleCheckboxChange}
      />

      <ListCardGeneric
        title="Selecione as medidas"
        items={measureItems}
        selectedIdsForList={selectedIds}
        onToggle={handleCheckboxChange}
      />
    </>
  )

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2.5 md:flex-row">
      {/* Left panel for md+ screens */}
      <div className="hidden md:flex h-full min-h-0 w-full md:w-60 flex-col gap-2.5">
        {panelContent}
      </div>

      {/* Coluna flex: no mobile o botão "Montar tabela" ocupa altura e a tabela fica com o restante (antes a paginação saía da tela) */}
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button aria-label="Montar tabela" variant="outline" size="sm" className="md:hidden self-start ml-2 mb-3 h-8 bg-sidebar border border-input shadow-2xs px-3 rounded-[4px] font-normal">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-secondary-foreground dark:text-secondary-foreground" />
                <span className="font-normal dark:text-secondary-foreground">Montar tabela</span>
              </div>
            </Button>
          </SheetTrigger>

          <div className="flex min-h-0 flex-1 flex-col">
          {selectedIds.length === 0 ? (
            <Card className="flex h-full w-full flex-1 items-center justify-center gap-2">
              <CornerUpLeft className="text-custom-table-label h-8 w-[88px]" />
              <span className="text-custom-table-label text-2xl font-medium tracking-[-0.6px]">
                Monte sua análise
              </span>
              <span className="text-foreground mt-1 max-w-[316px] text-center text-xs font-normal tracking-[0.11px]">
                Selecione as colunas que deseja combinar para montar a tabela
                desejada, <span className="hidden md:inline">no componente ao lado.</span>
                <span className="md:hidden">em "Montar tabela".</span>
              </span>
            </Card>
          ) : (
            <TableContainer
              key={selectedIds.join("|")}
              columns={selectedColumns}
            />
          )}
          </div>

          <SheetContent side="left" className="bg-sidebar backdrop-blur-custom border-input rounded-lg">
            <SheetHeader className="border-b border-border px-4 pt-6 pb-6">
              <div className="flex items-start justify-between w-full">
                <div>
                  <SheetTitle className="p-0">
                    <Typography variant="text-base" className="font-semibold text-secondary-foreground">
                      Configuração - Análise
                    </Typography>
                  </SheetTitle>
                  <SheetDescription>
                    <span className="font-normal text-[11px] tracking-[0.11px] text-muted-foreground">
                      Selecione as colunas conforme a análise que desejar e clique em finalizar para ver as informações.
                    </span>
                  </SheetDescription>
                </div>
                <div className="flex items-start">
                  <SheetClose asChild>
                    <button className="-mt-1 rounded p-1">
                      <X className="h-5 w-5 text-foreground" />
                    </button>
                  </SheetClose>
                </div>
              </div>
            </SheetHeader>

            <div className="flex h-full flex-col overflow-hidden p-3 gap-2">
              {panelContent}
            </div>

            <SheetFooter>
              <SheetClose asChild>
                <button className="w-full bg-foreground text-primary-foreground py-2 rounded">Finalizar</button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
