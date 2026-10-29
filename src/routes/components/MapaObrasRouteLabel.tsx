import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Checkbox } from "@/components/shadcn/checkbox";
import Typography from "@/components/Typography/Typography";
import { useTheme } from "@/shared/contexts/ThemeContext";

const STORAGE_KEY = "sinfralog_mapa_obras_modal_dismissed";

export const MapaObrasRouteLabel = () => {
  const [dontShowAgain, setDontShowAgain] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );
  const [showWelcome, setShowWelcome] = useState(!dontShowAgain);
  // Reinicia a remontagem do ícone a cada fechamento do guia
  const [vezesFechado, setVezesFechado] = useState(0);
  const { isDark } = useTheme();

  const handleDontShowAgainChange = (checked: boolean) => {
    setDontShowAgain(checked);
    localStorage.setItem(STORAGE_KEY, checked ? "true" : "false");
  };

  return (
    <>
      <AlertDialog
        open={showWelcome}
        onOpenChange={(aberto) => {
          setShowWelcome(aberto);
          if (!aberto) setVezesFechado((n) => n + 1);
        }}
      >
        {/* py-0 md:px-0: o cartão interno já é a moldura; o p-6 padrão do diálogo criaria uma borda vazia em volta dele */}
        <AlertDialogContent className="max-w-4xl border-0 py-0 md:px-0">
          <AlertDialogTitle className="sr-only">
            Bem-vindo ao painel gerencial do SINFRALOG
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            Informações sobre o Mapa de Obras e como utilizar as funcionalidades
            do painel
          </AlertDialogDescription>

          {/* Só o texto rola; o rodapé com "Fechar" fica sempre visível em telas baixas */}
          <div className="bg-background shadow-lg border-foreground/20 flex flex-col gap-6 sm:gap-10 rounded-lg border p-4 sm:p-6 max-h-[92dvh] overflow-hidden">
            <div className="flex min-h-0 flex-col sm:flex-row gap-6 overflow-y-auto">
              <div className="flex flex-col gap-4">
                <Typography className="text-lg leading-normal font-medium">
                  Bem-vindo ao Painel Gerencial
                </Typography>
                <Typography className="text-sm leading-normal font-normal">
                  Aqui, você poderá analisar o andamento das diversas{" "}
                  <span className="text-sm leading-normal font-semibold">
                    obras realizadas
                  </span>{" "}
                  pelo estado de Mato Grosso e seus diferentes municípios, assim
                  como os contratos atrelados à elas.
                </Typography>
                <Typography className="text-sm leading-normal font-normal">
                  Cada obra será representada por uma das{" "}
                  <span className="text-sm leading-normal font-semibold">
                    bolhas
                  </span>{" "}
                  no mapa, e elas trazem quatro informações de imediato:
                </Typography>
                <hr className="border-border" />
                <ul className="list-disc pl-4">
                  <li>
                    <Typography className="text-sm leading-normal font-normal">
                      <span className="text-sm leading-normal font-semibold">
                        Cor:
                      </span>{" "}
                      cada cor das bolhas diz respeito a um Tipo de Obra
                      diferente.
                    </Typography>
                  </li>
                  <li>
                    <Typography className="text-sm leading-normal font-normal">
                      <span className="text-sm leading-normal font-semibold">
                        Tamanho:
                      </span>{" "}
                      quanto maior o tamanho das bolhas, maior o tamanho do
                      orçamento da obra.
                    </Typography>
                  </li>
                  <li>
                    <Typography className="text-sm leading-normal font-normal">
                      <span className="text-sm leading-normal font-semibold">
                        Borda:
                      </span>{" "}
                      a borda das bolhas vai se fechando de acordo com a % da
                      execução da obra. Quanto mais próximo de 100%, mais
                      próxima a borda fica de se fechar totalmente.
                    </Typography>
                  </li>
                  <li>
                    <Typography className="text-sm leading-normal font-normal">
                      <span className="text-sm leading-normal font-semibold">
                        Legenda:
                      </span>{" "}
                      ao aproximar o mapa, abaixo de cada bolha aparecem o
                      número do contrato e o município da obra.
                    </Typography>
                  </li>
                </ul>
                <Typography className="text-sm leading-normal font-normal">
                  Ao afastar o mapa, as bolhas dão lugar aos{" "}
                  <span className="text-sm leading-normal font-semibold">
                    municípios
                  </span>
                  : quanto mais forte a cor, mais obras ele tem, e o número
                  dentro de cada um é a quantidade de obras.
                </Typography>
              </div>

              <div className="hidden sm:block min-w-40 max-h-110 rounded-sm border border-foreground/20 overflow-hidden">
                <img
                  src={isDark ? "./assets/map-tooltip.svg" : "./assets/map-tooltip-light.svg"}
                  alt="Mapa de Obras"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.error(
                      "Erro ao carregar a imagem do mapa de obras.",
                    );
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
            <div className="shrink-0 space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dont-show"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => handleDontShowAgainChange(checked as boolean)}
                />
                <label htmlFor="dont-show" className="text-sm text-foreground cursor-pointer">
                  Não exibir essa mensagem novamente.
                </label>
              </div>
              <AlertDialogAction
                className="bg-foreground text-background hover:bg-foreground/90 w-full"
              >
                Fechar
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Como ler o mapa"
            // after: área de toque de 44px em volta do ícone de 24px
            className="text-muted-foreground hover:text-foreground relative flex size-6 cursor-pointer after:absolute after:-inset-2.5 items-center justify-center rounded outline-none transicao-feedback focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => setShowWelcome(true)}
          >
            <Info
              key={vezesFechado}
              size={16}
              className="icone-info"
              data-remontar={vezesFechado > 0}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>Como ler o mapa</TooltipContent>
      </Tooltip>
    </>
  );
};
