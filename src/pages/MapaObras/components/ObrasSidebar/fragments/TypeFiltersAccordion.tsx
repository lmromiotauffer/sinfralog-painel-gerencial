import { Plus, Undo2 } from "lucide-react";
import type { ObraTypeFilter } from "../hooks/useTypeFilters";
import Typography from "@/components/Typography/Typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/tooltip";
import { cn } from "@/shared/utils/tailwind/cn";
import { getCategoryColorForTheme } from "@/components/Map/constants";
import { useTheme } from "@/shared/contexts/ThemeContext";

interface TypeFiltersAccordionProps {
  types: ObraTypeFilter[];
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTypeChange: (typeId: string) => void;
  onClearFilters: () => void;
}

export const TypeFiltersAccordion = ({
  types,
  title,
  isOpen,
  onOpenChange,
  onTypeChange,
  onClearFilters,
}: TypeFiltersAccordionProps) => {
  const { isDark } = useTheme();
  // Se nenhum está selecionado, todos estão "ativos" (mostram cor)
  const hasActiveFilters = types.some((t) => t.isSelected);

  return (
    <div className="w-full md:w-auto">
      <div className="md:max-w-none max-w-[344px] mx-auto md:mx-0">
        {/* O botão de limpar fica fora do gatilho (button dentro de button é HTML inválido) e é posicionado sobre a mesma vaga, antes do ícone +/- */}
        <div className="relative">
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => onOpenChange(!isOpen)}
            className="hover:bg-accent/30 flex w-full cursor-pointer items-center justify-between border-none p-2 sm:p-3 transition-colors"
          >
            <Typography
              variant="text-sm"
              className="text-secondary-foreground font-medium text-xs sm:text-sm"
            >
              {title}
            </Typography>
            {/* Um único "+": o traço vertical se recolhe e vira "−", em vez de trocar de ícone */}
            <Plus
              data-open={isOpen}
              className="icone-mais-menos text-muted-foreground h-3 w-3 sm:h-4 sm:w-4"
            />
          </button>
          {/* Fica montado mesmo sem filtros ativos, para poder sair animado; oculto, é inerte */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClearFilters}
                aria-label="Mostrar todos os tipos"
                data-visivel={hasActiveFilters}
                inert={!hasActiveFilters}
                className="botao-desfazer text-muted-foreground hover:text-foreground absolute right-6 top-1/2 -translate-y-1/2 rounded p-1 transicao-feedback hover:bg-accent/20 sm:right-9"
              >
                {/* Ao surgir, a seta volta girando no sentido anti-horário: anuncia o "desfazer" */}
                <Undo2 className="icone-desfazer h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs sm:text-sm">
              <p>Mostrar todos os tipos</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="sidebar-submenu grid" data-open={isOpen} inert={!isOpen}>
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-col gap-1 px-2 py-1 sm:py-2">
              {types.map((type) => {
                // Mostra cor se: está selecionado OU não há nenhuma seleção
                const showColor = type.isSelected || !hasActiveFilters;

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
          </div>
        </div>
      </div>
    </div>
  );
};
