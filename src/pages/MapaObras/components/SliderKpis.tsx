/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { KPIParams, useGenericKPI } from "@cluster-data-experience/qlik-modules";
import { EmblaOptionsType } from "embla-carousel";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/shadcn/carousel";
import { Variant1 } from "@/components/KPI/kpi-variant1";
import { Skeleton } from "@/components/shadcn/skeleton";
import { movimentoReduzido } from "@/shared/hooks/useMovimentoReduzido";

interface SliderKpisProps {
    kpis: KPIParams[];
    onEmblaApiReady?: (api: CarouselApi) => void;
}

// Repete os KPIs até preencher a faixa: com poucos, o loop do embla mostrava espaço vazio
const MIN_SLIDES = 12;

const KpiSlide = ({ kpi }: { kpi: { icon: string; title: string; value: string } }) => (
    <div className="flex flex-row items-center gap-6 px-2 relative">
        <Variant1
            icon={kpi.icon as any}
            title={kpi.title}
            // key pelo valor: ao filtrar, só os números que mudaram assentam de novo (mesma entrada do chip de filtro)
            value={<span key={kpi.value} className="inline-block animate-entrar-chip">{kpi.value}</span>}
        />
        <div className="h-10 w-px shrink-0 bg-border" />
    </div>
);

const KPI_SLIDER_OPTIONS: EmblaOptionsType = {
    align: 'start',
    loop: true,
    dragFree: true,
    containScroll: false,
    direction: 'ltr',
};

const mapKpis = (kpis: KPIParams[] | undefined, data: any) => {
    if (!Array.isArray(kpis) || !data) return [];
    return kpis.map((kpi: any, index: number) => {
        const qlikItem: any = data[index] || null;
        // Extract icon name from Qlik expression format "='icon-name'"
        const iconRaw = kpi.extraAttributes?.icon || '';
        const icon = iconRaw.replace(/^='|'$/g, '') || 'ellipse-boxes';
        return {
            icon,
            title: kpi.label || 'Não informado',
            value: qlikItem?.qText || 'Não informado',
        };
    });
};

const SliderKpis = ({ kpis, onEmblaApiReady }: SliderKpisProps) => {
    const { data, layout } = useGenericKPI(kpis);

    const kpiData = useMemo(() => {
        const mapeados = mapKpis(kpis, data);
        if (mapeados.length === 0 || mapeados.length >= MIN_SLIDES) return mapeados;
        return Array.from({ length: Math.ceil(MIN_SLIDES / mapeados.length) }).flatMap(() => mapeados);
    }, [kpis, data]);

    // Instância única do plugin: rolagem contínua em JS escapa do CSS de movimento reduzido; o usuário ainda pode dar play
    const [plugins] = useState(() => [
        AutoScroll({ playOnInit: !movimentoReduzido(), speed: 1, stopOnInteraction: false, stopOnMouseEnter: true }),
    ]);

    // Show skeleton only on INITIAL load (no layout or no data yet)
    // Don't show skeleton during refetch if we already have data (prevents flickering)
    const isInitialLoading = !layout || data === null;

    if (!kpis || kpis.length === 0) return null;

    if (isInitialLoading) {
        return (
            <div className="flex w-full h-full items-center justify-center min-h-10">
                <Skeleton className="w-full h-10 rounded-lg bg-muted" />
            </div>
        );
    }

    return (
        // Bordas esmaecidas: os cards entram e saem da rolagem em vez de serem cortados no padding
        <div className="relative flex w-full overflow-hidden h-full animate-esmaecer [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
            <Carousel opts={KPI_SLIDER_OPTIONS} plugins={plugins} setApi={onEmblaApiReady} className="w-full">
                <CarouselContent className="ml-0 h-full touch-pan-y">
                    {kpiData.map((kpi, index) => (
                        <CarouselItem key={index} className="basis-auto pl-0">
                            <KpiSlide kpi={kpi} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
};
export default SliderKpis;
