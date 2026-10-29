import { cn } from "@/shared/utils/tailwind/cn";
import type { ObraTypeFilter } from "../hooks";
import Typography from "@/components/Typography/Typography";
import { getCategoryColorForTheme } from "@/components/Map/constants";
import { useTheme } from "@/shared/contexts/ThemeContext";

interface ObraTypeFiltersProps {
  types: ObraTypeFilter[];
  onTypeChange: (typeId: string) => void;
  className?: string;
}

export const ObraTypeFilters = ({
  types,
  onTypeChange,
  className,
}: ObraTypeFiltersProps) => {
  const { isDark } = useTheme();
  // Se nenhum está selecionado, todos estão "ativos" (mostram cor)
  const hasSelection = types.some((t) => t.isSelected);

  return (
    <div className={cn("flex flex-col gap-1 px-2", className)}>
      {types.map((type) => {
        // Mostra cor se: está selecionado OU não há nenhuma seleção
        const showColor = type.isSelected || !hasSelection;

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onTypeChange(type.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
              "hover:bg-accent/50",
              !showColor && "opacity-60",
            )}
          >
            <div
              className="h-3 w-3 shrink-0 rounded-sm transition-colors"
              style={{ backgroundColor: showColor ? getCategoryColorForTheme(type.label, isDark) : "var(--colors-muted-foreground)" }}
            />
            <Typography
              className={cn(
                "flex-1 truncate transition-colors",
                showColor
                  ? "text-secondary-foreground"
                  : "text-muted-foreground",
              )}
              variant="text-2xs"
              title={type.label}
            >
              {type.label}
            </Typography>
          </button>
        );
      })}
    </div>
  );
};
