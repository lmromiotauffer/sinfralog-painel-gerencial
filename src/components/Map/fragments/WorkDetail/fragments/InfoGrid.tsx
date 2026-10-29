import Typography from "@/components/Typography/Typography";
import type { WorkDetails } from "../../../hooks/useWorkDetails";
import { formatadorBRL } from "@/shared/utils/formatarMoeda";
import { cn } from "@/shared/utils/tailwind/cn";

interface InfoGridProps {
  workDetails: WorkDetails;
}

/** Responde "está atrasada?" sem exigir conta: diferença entre previsto até hoje e executado, em pontos percentuais */
const situacaoCronograma = (execucao: number, esperado: number) => {
  const atraso = esperado - execucao;
  if (atraso > 15) return { texto: `${atraso} pontos abaixo do previsto`, cor: "text-destructive" };
  if (atraso > 5) return { texto: `${atraso} pontos abaixo do previsto`, cor: "text-n-alerta" };
  if (atraso < -5) return { texto: `${-atraso} pontos acima do previsto`, cor: "text-n-success" };
  return { texto: "No ritmo do cronograma", cor: "text-n-success" };
};

export const InfoGrid = ({ workDetails }: InfoGridProps) => {
  // Contrato e situação ficam no cabeçalho do card
  const indicadores = [
    ["Previsão de término", workDetails.executionEndDate || "Não informado"],
    ["Valor da obra", formatadorBRL.format(workDetails.workValue)],
    ["Executado", `${workDetails.execution}%`],
    ["Previsto até hoje", `${workDetails.expectedExecution}%`],
  ];
  const cronograma = situacaoCronograma(workDetails.execution, workDetails.expectedExecution);

  return (
    <div className="flex shrink-0 flex-col gap-3">
      <p data-ordem style={{ "--ordem": 1 } as React.CSSProperties} className={cn("flex items-center gap-2 text-sm font-medium", cronograma.cor)}>
        <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-current" />
        {cronograma.texto}
      </p>
      <div data-ordem style={{ "--ordem": 2 } as React.CSSProperties} className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">
        {indicadores.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex min-w-0 flex-col">
            <Typography variant="text-2xs" className="text-muted-foreground truncate" title={rotulo}>
              {rotulo}
            </Typography>
            <Typography variant="text-xs" className="text-foreground truncate font-medium" title={valor}>
              {valor}
            </Typography>
          </div>
        ))}
      </div>
      <div data-ordem style={{ "--ordem": 3 } as React.CSSProperties} className="flex flex-col gap-1">
        <Typography variant="text-sm" className="text-foreground">
          Descrição da obra:
        </Typography>
        <Typography
          variant="text-2xs"
          className="text-foreground line-clamp-4"
          title={workDetails.description || undefined}
        >
          {workDetails.description || "Não informada"}
        </Typography>
      </div>
    </div>
  );
};
