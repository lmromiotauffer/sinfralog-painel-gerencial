import { useCallback, useEffect, useMemo, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";
import { useQlikApp } from "@cluster-data-experience/qlik-modules";
import municipiosMT from "../data/municipios-mt.json";
import { municipios, dentroDoAnel } from "../utils/municipios";
import { intersecta, voar, ZOOM_MIN_MUNICIPIOS } from "../utils/mapUtils";
import { movimentoReduzido } from "@/shared/hooks/useMovimentoReduzido";
import type { MapLayerType, Work } from "../types";

interface CamadaMunicipiosProps {
  works: Work[];
  currentLayer: MapLayerType;
}

// Preenchimento por camada vem do CSS, usando a paleta oficial.
// Contorno sutil para o modo com bolhas; no modo coroplético o CSS (.municipio) sobrescreve
const COR_CONTORNO: Record<MapLayerType, string> = {
  dark: "rgba(255, 255, 255, 0.25)",
  light: "rgba(100, 116, 139, 0.4)",
  street: "rgba(100, 116, 139, 0.4)",
  satellite: "rgba(255, 255, 255, 0.4)",
};

// Campo do filtro de Município (public/pages/mapa-de-obras.json). O Qlik grava o nome em maiúsculas e com acento
// agudo no lugar do apóstrofo: "Mirassol d'Oeste" no GeoJSON é "MIRASSOL D´OESTE" no Qlik.
const CAMPO_MUNICIPIO = "Município";
const nomeNoQlik = (nome: string) => nome.toUpperCase().replace(/'/g, "´");

const emModoCoropletico = (map: L.Map) =>
  !map.getContainer().classList.contains("mostra-municipios");

// Quebra no espaço mais próximo do meio: "BARRA DO GARÇAS" → "BARRA DO<br>GARÇAS"
const quebrarAoMeio = (nome: string) => {
  const meio = nome.length / 2;
  const espacos = [...nome.matchAll(/ /g)].map((m) => m.index);
  const corte = espacos.reduce((melhor, i) => (Math.abs(i - meio) < Math.abs(melhor - meio) ? i : melhor), -1);
  return corte < 0 ? nome : `${nome.slice(0, corte)}<br>${nome.slice(corte + 1)}`;
};

// Ordem das tentativas até caber no bloco: nome em uma linha, em duas linhas, e só o círculo.
// No coroplético vale só a última: o círculo com a quantidade fica à mostra e o nome aparece no hover.
const TENTATIVAS: { duasLinhas: boolean; semNome: boolean }[] = [
  { duasLinhas: false, semNome: false },
  { duasLinhas: true, semNome: false },
  { duasLinhas: false, semNome: true },
];

// Círculo do bloco escala com a quantidade, como o cluster, numa faixa menor
const CIRCULO_MIN = 20;
const CIRCULO_MAX = 36;

// Municípios de MT: contorno + rótulo em zoom próximo; coroplético por quantidade de obras em zoom afastado
export const CamadaMunicipios = ({ works, currentLayer }: CamadaMunicipiosProps) => {
  const map = useMap();
  const { app } = useQlikApp();
  // O onEachFeature do GeoJSON só roda na criação da camada: o clique lê o app por ref para não ficar com um nulo
  const appRef = useRef(app);
  useEffect(() => {
    appRef.current = app;
  }, [app]);
  const rotulosRef = useRef(new Map<string, L.Tooltip>());
  // Rótulo com .rotulo-ativo e o polígono sob o cursor. O Edge às vezes não entrega o mouseout do polígono e o
  // rótulo ficava preso, então qualquer mousemove fora dele (no mapa ou no resto da página) também limpa.
  const ativoRef = useRef<{ poligono: Element; rotulo: Element } | null>(null);
  const limparAtivo = useCallback(() => {
    ativoRef.current?.rotulo.classList.remove("rotulo-ativo");
    ativoRef.current = null;
  }, []);

  useEffect(() => {
    const aoMover = (e: MouseEvent) => {
      if (ativoRef.current && e.target !== ativoRef.current.poligono) limparAtivo();
    };
    document.addEventListener("mousemove", aoMover);
    return () => document.removeEventListener("mousemove", aoMover);
  }, [limparAtivo]);

  // Total de obras por município
  const obrasPorMunicipio = useMemo(() => {
    const contagem = new Map<string, number>();
    works.forEach((work) => {
      if (work.municipio) contagem.set(work.municipio, (contagem.get(work.municipio) ?? 0) + 1);
    });
    return contagem;
  }, [works]);

  const estilo = useMemo(() => {
    const maximo = Math.max(1, ...obrasPorMunicipio.values());
    return (feature?: Feature) => {
      const quantidade = obrasPorMunicipio.get(feature?.properties?.nome) ?? 0;
      return {
        className: "municipio",
        color: COR_CONTORNO[currentLayer],
        weight: 1,
        // Escala log: a distribuição é muito concentrada (Cuiabá com ~100 obras, mediana 5), linear ou raiz apagam o interior
        fillOpacity: quantidade ? 0.15 + 0.6 * (Math.log1p(quantidade) / Math.log1p(maximo)) : 0,
      };
    };
  }, [obrasPorMunicipio, currentLayer]);

  // Rótulos são tooltips próprios ancorados no polo de inacessibilidade (o Leaflet ancoraria no centroide,
  // que em municípios irregulares cai na borda). Independem da camada GeoJSON, que remonta ao trocar de tile.
  // Visibilidade decidida pelo encaixe abaixo (.rotulo-cabe).
  useEffect(() => {
    const rotulos = rotulosRef.current;
    municipios.forEach(({ nome, polo }) => {
      rotulos.set(
        nome,
        L.tooltip({ permanent: true, direction: "center", className: "rotulo-municipio", pane: "overlayPane" })
          .setLatLng([polo.lat, polo.lng])
          .setContent(nome)
          .addTo(map),
      );
    });
    return () => {
      rotulos.forEach((rotulo) => rotulo.remove());
      rotulos.clear();
    };
  }, [map]);

  // Rótulo só aparece se os quatro cantos do nome caem dentro do polígono real e não colide com outro rótulo,
  // em qualquer zoom. Tenta uma linha, duas linhas e fonte menor antes de esconder; municípios com mais obras
  // têm prioridade. A contagem no conteúdo acompanha os filtros (obrasPorMunicipio nas deps).
  // ponytail: testa cantos, não arestas; uma reentrância entre dois cantos ainda pode ser cruzada pela borda do texto
  useEffect(() => {
    let agendado = 0;
    // Tamanho de cada rótulo por tentativa e modo: depende do conteúdo e do CSS, não do zoom. Medido uma vez por
    // filtro (o efeito recomeça quando obrasPorMunicipio muda) e reaproveitado a cada zoom/pan.
    const tamanhos = new Map<string, { width: number; height: number }>();
    // Conteúdo já escrito em cada elemento, para só tocar no DOM o que mudou
    const aplicado = new Map<string, string>();

    // noZoom: chamado no início de um zoom animado (ver aoAnimarZoom)
    const resolver = (noZoom = false) => {
      agendado = 0;
      const ocupados: DOMRect[] = [];
      const quantidade = (nome: string) => obrasPorMunicipio.get(nome) ?? 0;
      const maximo = Math.max(1, ...obrasPorMunicipio.values());
      const coropletico = emModoCoropletico(map);
      const tentativas = coropletico ? TENTATIVAS.filter((t) => t.semNome) : TENTATIVAS;
      const chave = (nome: string, t: number) => `${nome}|${t}|${coropletico}`;
      // Sem obras o bloco fica sem preenchimento, o que já diz zero: só o nome, sem círculo.
      const conteudoRotulo = (nome: string, duasLinhas: boolean) => {
        const total = quantidade(nome);
        const tamanho = Math.round(CIRCULO_MIN + (CIRCULO_MAX - CIRCULO_MIN) * (Math.log1p(total) / Math.log1p(maximo)));
        const circulo = total ? `<b class="bloco-cluster" style="--tamanho: ${tamanho}px">${total}</b>` : "";
        return `${circulo}<span class="bloco-nome">${duasLinhas ? quebrarAoMeio(nome) : nome}</span>`;
      };
      const container = map.getContainer().getBoundingClientRect();
      const paraLatLng = (x: number, y: number) =>
        map.containerPointToLatLng([x - container.left, y - container.top]);
      // Retângulo: os quatro cantos. Círculo: quatro extremos da circunferência e os cantos do quadrado inscrito
      const dentroDoBloco = (caixa: DOMRect, circulo: boolean, aneis: (typeof municipios)[number]["aneis"]) => {
        const { left, right, top, bottom, width, height } = caixa;
        const cx = left + width / 2;
        const cy = top + height / 2;
        const recuo = (1 - Math.SQRT1_2) / 2; // canto do quadrado inscrito no círculo
        const pontos = circulo
          ? [
              [cx, top], [cx, bottom], [left, cy], [right, cy],
              [left + width * recuo, top + height * recuo], [right - width * recuo, top + height * recuo],
              [left + width * recuo, bottom - height * recuo], [right - width * recuo, bottom - height * recuo],
            ]
          : [[left, top], [right, top], [left, bottom], [right, bottom]];
        const coordenadas = pontos.map(([x, y]) => paraLatLng(x, y));
        return aneis.some((anel) => coordenadas.every((c) => dentroDoAnel(anel, c.lng, c.lat)));
      };

      const rotulos = municipios.flatMap((m) => {
        const elemento = rotulosRef.current.get(m.nome)?.getElement();
        return elemento ? [{ ...m, elemento }] : [];
      });
      // No zoom só se decide o que cabe, com tamanhos já medidos: medir reescreve o conteúdo, e no meio da animação
      // quem posiciona os rótulos é o Leaflet
      if (noZoom && rotulos.some(({ nome }) => tentativas.some((_, t) => !tamanhos.has(chave(nome, t))))) return;
      const aplicar = (elemento: HTMLElement, nome: string, { duasLinhas, semNome }: (typeof TENTATIVAS)[number]) => {
        elemento.classList.toggle("sem-nome", semNome);
        elemento.innerHTML = conteudoRotulo(nome, duasLinhas);
      };

      // Mede em lote o que ainda não tem tamanho: escreve a tentativa em todos os pendentes e só depois lê, um layout
      // por tentativa. Escrever e medir rótulo a rótulo (o setContent do Leaflet lê offsetWidth logo após trocar o
      // innerHTML) forçava centenas de layouts síncronos por zoom, ~1 s de travada.
      tentativas.forEach((tentativa, t) => {
        const pendentes = rotulos.filter(({ nome }) => !tamanhos.has(chave(nome, t)));
        pendentes.forEach(({ nome, elemento }) => {
          aplicar(elemento, nome, tentativa);
          aplicado.delete(nome);
        });
        pendentes.forEach(({ nome, elemento }) => {
          const { width, height } = elemento.getBoundingClientRect();
          tamanhos.set(chave(nome, t), { width, height });
        });
      });
      // Só o tamanho importa: o tooltip (direction center) fica centrado no polo
      const caixa = ({ nome, polo }: (typeof rotulos)[number], t: number) => {
        const { width, height } = tamanhos.get(chave(nome, t))!;
        const centro = map.latLngToContainerPoint([polo.lat, polo.lng]);
        return new DOMRect(container.left + centro.x - width / 2, container.top + centro.y - height / 2, width, height);
      };

      [...rotulos]
        .sort((a, b) => quantidade(b.nome) - quantidade(a.nome))
        .forEach((r) => {
          let ultima = 0;
          let escolha: { t: number; cabe: boolean } | undefined;
          for (let t = 0; t < tentativas.length && !escolha; t++) {
            const { duasLinhas, semNome } = tentativas[t];
            if (duasLinhas && !r.nome.includes(" ")) continue;
            ultima = t;
            // Sem obras não há círculo: nada em repouso, o nome fica para o hover
            if (semNome && !quantidade(r.nome)) break;
            const c = caixa(r, t);
            if (dentroDoBloco(c, semNome, r.aneis) && !ocupados.some((o) => intersecta(c, o))) {
              ocupados.push(c);
              escolha = { t, cabe: true };
            }
          }
          const { t, cabe } = escolha ?? { t: ultima, cabe: false };
          // No início do zoom só sai quem não vai caber; quem passa a caber entra no zoomend. Entrando já no início,
          // o círculo novo ficava espremido entre os vizinhos enquanto os municípios ainda cresciam.
          if (!noZoom || !cabe) r.elemento.classList.toggle("rotulo-cabe", cabe);
          // Conteúdo e posição novos ficam para o zoomend
          if (noZoom || aplicado.get(r.nome) === chave(r.nome, t)) return;
          aplicado.set(r.nome, chave(r.nome, t));
          aplicar(r.elemento, r.nome, tentativas[t]);
          // Conteúdo novo, tamanho novo: recentraliza no polo como o Leaflet faria, sem medir de novo
          const { width, height } = tamanhos.get(chave(r.nome, t))!;
          L.DomUtil.setPosition(
            r.elemento,
            map.latLngToLayerPoint([r.polo.lat, r.polo.lng]).subtract([Math.round(width / 2), Math.round(height / 2)]),
          );
        });
    };

    const agendar = () => {
      if (!agendado) agendado = requestAnimationFrame(() => resolver());
    };

    // Rótulos esperavam o zoom terminar para sair e ficavam se atropelando durante a animação. Logo depois do
    // zoomanim o Leaflet já põe o estado do mapa na vista de destino (só a animação CSS segue), então o encaixe do
    // próximo quadro já vale para o fim do zoom: aplica só as saídas (ver noZoom no resolver). Só no coroplético,
    // onde o conteúdo não muda com o zoom.
    const aoAnimarZoom = (e: L.ZoomAnimEvent) => {
      if (!emModoCoropletico(map) || e.zoom >= ZOOM_MIN_MUNICIPIOS) return;
      cancelAnimationFrame(agendado);
      agendado = requestAnimationFrame(() => resolver(true));
    };

    // A fonte condensada é webfont (display=swap): o que foi medido antes dela chegar vale de novo
    let ativo = true;
    document.fonts.ready.then(() => {
      if (!ativo) return;
      tamanhos.clear();
      agendar();
    });

    map.on("zoomend moveend", agendar);
    map.on("zoomanim", aoAnimarZoom);
    agendar();
    return () => {
      ativo = false;
      map.off("zoomend moveend", agendar);
      map.off("zoomanim", aoAnimarZoom);
      cancelAnimationFrame(agendado);
    };
  }, [map, obrasPorMunicipio]);

  return (
    <GeoJSON
      key={`geo-all-${currentLayer}`}
      data={municipiosMT as GeoJsonObject}
      style={estilo}
      onEachFeature={(feature, layer) => {
        const poligono = layer as L.Polygon;
        // No coroplético o rótulo com a contagem aparece no hover (classe .rotulo-ativo)
        layer.on("mouseover", () => {
          limparAtivo();
          poligono.bringToFront();
          const rotulo = rotulosRef.current.get(feature.properties?.nome)?.getElement();
          const elemento = poligono.getElement();
          if (!rotulo || !elemento) return;
          rotulo.classList.add("rotulo-ativo");
          ativoRef.current = { poligono: elemento, rotulo };
        });
        layer.on("mouseout", limparAtivo);
        layer.on("click", () => {
          // Voo como os demais deslocamentos: é o caminho principal do coroplético para as bolhas. Município grande
          // em tela estreita cabia abaixo de ZOOM_MIN_MUNICIPIOS e o clique voava sem sair do coroplético: o zoom
          // nunca fica abaixo do limiar, mesmo que o município não caiba inteiro.
          // O clique também filtra pelo município, substituindo a seleção anterior do campo (os demais filtros
          // seguem): KPIs, lista e bolhas passam a mostrar só as obras dele.
          if (emModoCoropletico(map)) {
            const nome = feature.properties?.nome;
            if (nome && appRef.current) {
              appRef.current
                .getField(CAMPO_MUNICIPIO)
                .then((campo) => campo.selectValues([{ qText: nomeNoQlik(nome) }], false, false))
                .catch((erro) => console.warn("[CamadaMunicipios] Erro ao filtrar município:", erro));
            }
            const limites = poligono.getBounds();
            const zoom = Math.max(map.getBoundsZoom(limites, false, L.point(120, 120)), ZOOM_MIN_MUNICIPIOS);
            voar(map, limites.getCenter(), zoom, movimentoReduzido());
          }
        });
      }}
    />
  );
};
