import { cn } from "@/shared/utils/tailwind/cn";
import Typography from "../Typography/Typography";
import { FilterObjectContainer } from "@/shared/components/FilterObjectContainer/FilterObjectContainer";
import { FilterIcon } from "lucide-react";

export type FilterConfig = {
  expression: string;
  label: string;
};

export type FilterMenuProps = {
  filters: FilterConfig[];
  className?: string;
};

export const FilterMenu: React.FC<FilterMenuProps> = ({
  filters,
  className,
}) => {
  return (
    <header className={cn("flex items-center gap-1.5", className)}>
      <span className="flex flex-row gap-1 items-center justify-center-safe text-foreground">
        <FilterIcon className="w-5 h-5 mb-1" />
        <Typography variant="text-sm">Filtros:</Typography>
      </span>
      {filters.map((filter, index) => (
        <FilterObjectContainer
          key={index}
          def={[filter.expression]}
          label={filter.label}
          className="w-auto max-w-[280px] h-8 flex-1 grow rounded-sm "
        />
      ))}
    </header>
  );
};
