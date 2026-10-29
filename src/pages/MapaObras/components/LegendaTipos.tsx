import { useMemo } from "react";
import { getCategoryColorForTheme } from "@/components/Map/constants";
import type { Work } from "@/components/Map/types";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { cn } from "@/shared/utils/tailwind/cn";

interface LegendaTiposProps {
  works: Work[];
  className?: string;
}

// Legenda fixa de cores: lista só os tipos presentes nas obras renderizadas, então reage aos filtros.
// Some no coroplético (regra .legenda-tipos em Map.style.css), onde a cor não diferencia nada.
export const LegendaTipos = ({ works, className }: LegendaTiposProps) => {
  const { isDark } = useTheme();
  const tipos = useMemo(
    () => [...new Set(works.map((work) => work.category))].sort(),
    [works],
  );

  if (tipos.length === 0) return null;

  // O wrapper em grid recolhe a altura na troca de visão (.legenda-tipos em Map.style.css)
  return (
    <div className={cn("legenda-tipos grid", className)}>
      <ul
        aria-label="Legenda dos tipos de obra"
        className="flex min-h-0 select-none flex-col gap-1 overflow-hidden rounded-lg border border-input bg-sidebar px-2.5 py-2 shadow-lg backdrop-blur-custom"
      >
        {tipos.map((tipo) => (
          <li
            key={tipo}
            className="flex items-center gap-2 text-[11px] font-medium leading-none text-foreground"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: getCategoryColorForTheme(tipo, isDark) }}
            />
            {tipo}
          </li>
        ))}
      </ul>
    </div>
  );
};
