import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { intersecta } from "../utils/mapUtils";

// Evita que a legenda de uma bolha caia sobre o anel de outra, sobre um cluster ou sobre outra legenda:
// tenta abaixo, depois acima, e se ainda colidir esconde (o hover continua mostrando os dados).
// ponytail: passada O(n²) por movimento; n é o que cabe na tela (poucas centenas no pior caso).
export const ColisaoLegendas = () => {
  const map = useMap();

  useEffect(() => {
    let agendado = 0;

    const resolver = () => {
      agendado = 0;
      const obstaculos = Array.from(
        map.getContainer().querySelectorAll<HTMLElement>(".custom-marker, .custom-marker-cluster"),
      );
      // Escreve tudo e depois mede tudo: alternar a classe e medir legenda a legenda forçava um layout por legenda
      const legendas = obstaculos.map((o) => o.querySelector<HTMLElement>(".legenda-obra"));
      legendas.forEach((legenda) => legenda?.classList.remove("legenda-acima", "legenda-oculta"));
      const aneis = obstaculos.map((m) => m.getBoundingClientRect());
      const abaixo = legendas.map((legenda) => legenda?.getBoundingClientRect());
      const ocupados: DOMRect[] = [];

      legendas.forEach((legenda, i) => {
        if (!legenda) return;
        const colide = (r: DOMRect) =>
          aneis.some((anel, j) => j !== i && intersecta(r, anel)) ||
          ocupados.some((o) => intersecta(r, o));

        let rect = abaixo[i]!;
        if (colide(rect)) {
          // .legenda-acima espelha a caixa no anel (top: 100% vira bottom: 100%, mesma folga): calculada, não medida
          const folga = rect.top - aneis[i].bottom;
          rect = new DOMRect(rect.left, aneis[i].top - folga - rect.height, rect.width, rect.height);
          legenda.classList.add("legenda-acima");
        }
        if (colide(rect)) {
          legenda.classList.add("legenda-oculta");
          return;
        }
        ocupados.push(rect);
      });
    };

    const agendar = () => {
      if (!agendado) agendado = requestAnimationFrame(resolver);
    };

    map.on("moveend zoomend layeradd layerremove", agendar);
    agendar();
    return () => {
      map.off("moveend zoomend layeradd layerremove", agendar);
      cancelAnimationFrame(agendado);
    };
  }, [map]);

  return null;
};
