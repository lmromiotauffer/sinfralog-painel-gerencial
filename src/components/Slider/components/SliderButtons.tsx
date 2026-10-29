import React, { useState, useEffect, useRef } from "react";
import { EmblaCarouselType } from "embla-carousel";
import { Pause, Play } from "lucide-react";

// Circular progress SVG
const radius = 12;
const circumference = 2 * Math.PI * radius;
// Normalizar progress para 0-100 para cálculo do offset (evita inversão de cores)
const drawProgress = (ring: SVGCircleElement | null, progress: number) =>
    ring?.setAttribute("stroke-dashoffset", String(circumference - ((progress % 100) / 100) * circumference));

interface SliderButtonsProps {
    emblaApi?: EmblaCarouselType;
}

export const SliderButtons: React.FC<SliderButtonsProps> = ({ emblaApi }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const ringRef = useRef<SVGCircleElement>(null);
    const setProgress = (progress: number) => drawProgress(ringRef.current, progress);

    const handleToggle = () => {
        if (!emblaApi) return;

        const autoScroll = emblaApi.plugins()?.autoScroll;
        if (!autoScroll) return;

        const playOrStop = autoScroll.isPlaying()
            ? autoScroll.stop
            : autoScroll.play;
        playOrStop();
    };

    useEffect(() => {
        if (!emblaApi) return;

        const autoScroll = emblaApi.plugins()?.autoScroll;
        if (!autoScroll) return;

        setIsPlaying(autoScroll.isPlaying());

        const handlePlayStart = () => setIsPlaying(true);
        const handlePlayStop = () => setIsPlaying(false);

        const handleReInit = () => {
            setIsPlaying(autoScroll.isPlaying());
            setProgress(0);
        };

        emblaApi
            .on('autoScroll:play', handlePlayStart)
            .on('autoScroll:stop', handlePlayStop)
            .on('reInit', handleReInit);

        return () => {
            emblaApi
                .off('autoScroll:play', handlePlayStart)
                .off('autoScroll:stop', handlePlayStop)
                .off('reInit', handleReInit);
        };
    }, [emblaApi]);

    // Continuous progress update using requestAnimationFrame.
    // Escreve direto no SVG: um setState por frame rerenderizava o componente 60 vezes por segundo,
    // disputando o main thread com a animação do mapa
    useEffect(() => {
        if (!isPlaying || !emblaApi) return;

        let animationFrameId: number;

        // Multiplicar por 2 para sincronizar com o tempo do slider
        const updateProgress = () => setProgress(emblaApi.scrollProgress() * 100 * 2);

        // requestAnimationFrame para suavidade
        const animationLoop = () => {
            updateProgress();
            animationFrameId = requestAnimationFrame(animationLoop);
        };

        animationFrameId = requestAnimationFrame(animationLoop);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying, emblaApi]);

    return (
        <div className="relative flex items-center justify-center w-7 h-7">
            {/* Circular progress background */}
            <svg
                className="absolute"
                viewBox="0 0 28 28"
                width="28"
                height="28"
                style={{ minWidth: 28, minHeight: 28 }}
            >
                {/* Background circle */}
                <circle
                    cx="14"
                    cy="14"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-foreground opacity-30"
                />
                {/* Progress circle */}
                <circle
                    ref={ringRef}
                    cx="14"
                    cy="14"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    strokeLinecap="round"
                    transform="rotate(-90 14 14)"
                    // Sem transição no traço: o rAF já desenha cada quadro, e animar o dashoffset
                    // fazia o anel girar de volta na virada de 100% para 0%. Pausado, o arco esmaece.
                    className={`text-n-success transicao-feedback ${isPlaying ? "" : "opacity-50"}`}
                />
            </svg>

            {/* Button */}
            <button
                type="button"
                onClick={handleToggle}
                aria-label={isPlaying ? "Pausar a rotação dos indicadores" : "Retomar a rotação dos indicadores"}
                className="relative z-10 flex items-center justify-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-full transition-[scale] duration-(--duracao-curta) ease-(--ease-suave) active:scale-90 active:duration-[80ms]"
            >
                {/* key remonta o ícone na troca, para ele surgir em vez de trocar seco */}
                {isPlaying ? (
                    <Pause key="pausar" size={10} strokeWidth={4} className="text-n-success animate-surgir-contador" />
                ) : (
                    <Play key="retomar" size={10} strokeWidth={4} fill="currentColor" className="text-n-success animate-surgir-contador" />
                )}
            </button>
        </div>
    );
};