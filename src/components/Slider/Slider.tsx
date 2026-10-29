/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

type PropType<T> = {
  slides: T[];
  options?: EmblaOptionsType;
  renderSlide: (slide: T, index: number) => React.ReactNode;
  className?: string;
  onEmblaInit?: (emblaApi: any, slideCount: number) => void;
};

const Slider = <T,>(props: PropType<T>) => {
  const { slides, options, renderSlide, className, onEmblaInit } = props

  const slidesToRender = React.useMemo(() => {
    if (slides.length === 0) return []
    const MIN_SLIDES = 12
    if (slides.length >= MIN_SLIDES) return slides

    const multiplier = Math.ceil(MIN_SLIDES / slides.length)
    return Array.from({ length: multiplier }).flatMap(() => slides)
  }, [slides])

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, ...options }, [
    AutoScroll({
      playOnInit: true,
      speed: 1,
      stopOnInteraction: false,
      stopOnMouseEnter: true
    })
  ])

  React.useEffect(() => {
    if (emblaApi && onEmblaInit) {
      onEmblaInit(emblaApi, slides.length)
    }
  }, [emblaApi, onEmblaInit, slides.length])

  return (
    <div className={`embla w-full overflow-hidden ${className || ''}`} ref={emblaRef}>
      <div className="embla__container flex touch-pan-y h-full">
        {slidesToRender.map((slide, index) => (
          <div className="embla__slide flex-[0_0_auto] min-w-0" key={index}>
            {renderSlide(slide, index)}
          </div>
        ))}
      </div>
    </div>
  )
}
export default Slider
