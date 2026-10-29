import Typography from "@/components/Typography/Typography";
import { ArrowDownUp, Maximize, Minimize } from "lucide-react";
import { cn } from "@/shared/utils/tailwind/cn";
import { useState } from "react";

interface SidebarHeaderProps {
  title: string;
  isExpanded?: boolean;
  larguraAnimando?: boolean;
  onToggleExpand?: () => void;
  sortControls: React.ReactNode;
}

export const SidebarHeader = ({
  title,
  isExpanded,
  larguraAnimando,
  onToggleExpand,
  sortControls,
}: SidebarHeaderProps) => {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  // Cada clique remonta o ícone para repetir a animação; 0 = nada anima no carregamento
  const [cliquesOrdenar, setCliquesOrdenar] = useState(0);

  // Cantos animam só quando o estado muda, nunca no primeiro render
  const [expandidoAnterior, setExpandidoAnterior] = useState(isExpanded);
  const [animarCantos, setAnimarCantos] = useState(false);
  if (expandidoAnterior !== isExpanded) {
    setExpandidoAnterior(isExpanded);
    setAnimarCantos(true);
  }
  const classeCantos = cn("size-4", animarCantos && "cantos-painel");

  return (
    <>
      <div className="px-4 pt-4 pb-2 flex justify-between items-center shrink-0">
        <Typography variant="text-base" className="font-semibold text-secondary-foreground">
          {/* O rótulo entra só quando a animação de largura termina */}
          {title}{" "}
          {isExpanded && !larguraAnimando && <span className="animate-esmaecer">| Expandida</span>}
        </Typography>
        <div className="flex gap-1 text-muted-foreground">
          <button
            type="button"
            aria-expanded={sortMenuOpen}
            aria-label="Ordenar"
            title="Ordenar"
            onClick={() => {
              setSortMenuOpen((aberto) => !aberto);
              setCliquesOrdenar((n) => n + 1);
            }}
            className={cn(
              "hover:text-foreground flex size-7 cursor-pointer items-center justify-center rounded outline-none transicao-feedback focus-visible:ring-[3px] focus-visible:ring-ring/50",
              sortMenuOpen && "text-foreground",
            )}
          >
            <ArrowDownUp
              key={cliquesOrdenar}
              className={cn("size-4", cliquesOrdenar > 0 && "setas-ordenar")}
            />
          </button>
          {onToggleExpand && (
            <button
              type="button"
              aria-label={isExpanded ? "Reduzir lista" : "Ampliar lista"}
              title={isExpanded ? "Reduzir lista" : "Ampliar lista"}
              aria-pressed={isExpanded}
              onClick={onToggleExpand}
              className="hover:text-foreground flex size-7 cursor-pointer items-center justify-center rounded outline-none transicao-feedback focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {/* Trocar de ícone já remonta o svg, então a animação roda a cada mudança */}
              {isExpanded ? (
                <Minimize className={classeCantos} style={{ "--sentido-cantos": -1 } as React.CSSProperties} />
              ) : (
                <Maximize className={classeCantos} style={{ "--sentido-cantos": 1 } as React.CSSProperties} />
              )}
            </button>
          )}
        </div>
      </div>
      {/* Em linha, como o acordeão "Tipos de obra": nada sobrepõe a UI nem soma camadas translúcidas */}
      {/* Desdobra no lugar (grade 0fr → 1fr), como o submenu lateral: a lista desce junto, sem salto */}
      {/* Divisória no contêiner, não no conteúdo recortado: desce com a borda e esmaece com o painel.
          -mt-px anula o 1px da borda quando fechado (sobe sobre o pb-2 vazio do cabeçalho). */}
      <div className="sidebar-submenu grid shrink-0 -mt-px border-b border-input" data-open={sortMenuOpen} inert={!sortMenuOpen}>
        <div className="min-h-0 overflow-hidden">{sortControls}</div>
      </div>
    </>
  );
};
