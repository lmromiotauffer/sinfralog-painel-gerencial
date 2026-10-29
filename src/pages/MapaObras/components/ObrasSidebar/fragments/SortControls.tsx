import {
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownAZ,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import type { SortField, SortOrder } from "../hooks/useSidebarData";
import { cn } from "@/shared/utils/tailwind/cn";

interface SortControlsProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderToggle: (order: SortOrder) => void;
}

const SortButton = ({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors duration-(--duracao-curta) ease-(--ease-cor)",
      active
        ? "text-n-active-foreground"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
    )}
  >
    <Icon className="size-3.5" />
    <span>{label}</span>
  </button>
);

export const SortControls = ({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderToggle,
}: SortControlsProps) => {
  return (
    <div className="flex flex-col gap-3 px-4 pb-3">
      {/* Título */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-secondary-foreground">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Ordenação</span>
      </div>

      <div className="flex flex-col gap-2 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Ordenar por
          </span>

          <Select
            value={sortField}
            onValueChange={(v) => onSortFieldChange(v as SortField)}
          >
            <SelectTrigger className="h-8 w-full bg-sidebar text-xs">
              <SelectValue placeholder="Selecionar campo" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="tipo">Tipo de obra</SelectItem>
              <SelectItem value="execucao">Executado (%)</SelectItem>
              <SelectItem value="dataConclusao">Previsão de término</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Ordem
          </span>

          <div className="relative inline-flex rounded-md border border-input bg-sidebar p-0.5 shadow-sm">
            {/* Indicador deslizante: o fundo ativo se move entre as opções */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-sm bg-n-active transition-transform duration-(--duracao-media) ease-(--ease-suave)",
                sortOrder === "desc" && "translate-x-full"
              )}
            />
            <SortButton
              active={sortOrder === "asc"}
              label="Crescente"
              icon={ArrowUpAZ}
              onClick={() => onSortOrderToggle("asc")}
            />
            <SortButton
              active={sortOrder === "desc"}
              label="Decrescente"
              icon={ArrowDownAZ}
              onClick={() => onSortOrderToggle("desc")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
