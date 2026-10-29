/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PropsWithChildren, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SideMenu } from "@/components/SideMenu/SideMenu";
import { SidebarProvider, SidebarTrigger } from "@/components/shadcn/sidebar";
import { useRootRoute } from "./hooks/useRootRoute";
import { PageLoader } from "@/components/PageLoader/PageLoader";
import { useQlikApp } from "@cluster-data-experience/qlik-modules";
import { useMobileScreen } from "@/shared/hooks/useMobileScreen";
import { useParalaxeFundo } from "@/shared/hooks/useParalaxeFundo";
import { FilterPane } from "@/components/FilterPane/FilterPane";
import { FilterSheet } from "@/components/FilterSheet/FilterSheet";
import Card from "@/components/Card/components/Root/Root";
import SearchBox from "@/components/SearchBox/SearchBox";
import Typography from "@/components/Typography/Typography";
import { cn } from "@/shared/utils/tailwind/cn";
import { ObrasSidebar } from "@/pages/MapaObras/components/ObrasSidebar/ObrasSidebar";
import useFetchJson from "@/shared/hooks/useFetchJson";
import { useSelectedWork } from "@/components/Map";
import { Aviso } from "@/components/Aviso/Aviso";

export const Layout = ({ children }: PropsWithChildren) => {
  const { lastUpdatedDate, currentRoute, currentSelections } = useRootRoute();
  const { app } = useQlikApp();

  useEffect(() => {
    if (app) {
      const initSessionVariable = async () => {
        try {
          const existingVar = await app.getVariableByName("vObraSelecionada");
          if (existingVar) return;
        } catch {
          try {
            await app.createSessionVariable({
              qInfo: { qType: "variable" },
              qName: "vObraSelecionada",
              qDefinition: "",
              qIncludeInBookmark: false,
            });
          } catch (err) {
            console.error("Erro ao criar variável vObraSelecionada", err);
          }
        }
      };
      initSessionVariable();
    }
  }, [app]);
  const isMobile = useMobileScreen(1024);
  useParalaxeFundo();
  // Abaixo de 1366px o menu começa recolhido: aberto, o mapa ficava espremido entre ele e a lista
  const menuRecolhido = useMobileScreen(1366);
  const location = useLocation();
  const [isObrasExpanded, setIsObrasExpanded] = useState(false);
  // true entre o clique e o transitionend da largura da lista (250ms abrindo, 200ms fechando)
  const [larguraAnimando, setLarguraAnimando] = useState(false);
  // O loader continua montado por cima do app até terminar de esmaecer
  const [carregadorVisivel, setCarregadorVisivel] = useState(true);
  const { data: mapaObrasData } = useFetchJson("./pages/mapa-de-obras.json");
  const filters = mapaObrasData?.filterpane || [];

  const isMapaObras = location.pathname === "/mapa-de-obras";

  const selectedWork = useSelectedWork();

  const carregador = carregadorVisivel && (
    <PageLoader saindo={!!app} aoSair={() => setCarregadorVisivel(false)} />
  );

  // Mesma posição na árvore com e sem app: o loader não remonta ao começar a sair
  if (!app) return <>{null}{carregador}</>;

  return (
    <>
    <div
      className={cn(
        // h-dvh: no celular 100vh inclui a área sob a barra do navegador e escondia o rodapé
        "relative z-10 flex h-dvh w-screen overflow-hidden",
        {
          "pointer-events-none": isMapaObras,
          // Só no mapa: nas outras páginas o fundo animado fica à vista, como nos demais painéis
          "bg-gradient-both": isMapaObras,
        },
      )}
    >
      <SidebarProvider defaultOpen={!menuRecolhido}>
        <div
          className={cn("relative z-10 flex h-full w-full gap-2", {
            "pointer-events-none": isMapaObras,
          })}
        >
          <div className="flex h-full w-full">
            <div className="pointer-events-auto">
              <SideMenu appLastUpdatedDate={lastUpdatedDate} />
            </div>

            <div className={cn("flex h-full flex-1 flex-col gap-2 overflow-hidden", isMobile ? "p-0" : "pl-2")}>
              <div className={cn("flex h-full flex-1 flex-col gap-2 overflow-hidden", isMobile ? "p-0" : "p-2")}>
                {!isMobile && filters.length > 0 && (
                  <Card className="pointer-events-auto min-h-8 w-full shrink-0 p-0 px-4">
                    <FilterPane filters={filters} selections={currentSelections} />
                  </Card>
                )}

                <div
                  className={cn(
                    "flex h-full w-full flex-1 flex-col overflow-hidden",
                    {
                      "pt-14": isMobile,
                      "pointer-events-none": isMapaObras,
                    },
                  )}
                >
                  <div
                    className="flex h-full w-full overflow-hidden"
                    onTransitionEnd={(e) => {
                      if (e.propertyName === "width") setLarguraAnimando(false);
                    }}
                  >
                    {/* Escondido enquanto a lista anima a largura: evita o cabeçalho refluindo e a busca deslizando.
                        main só no conteúdo da página: menu, filtros e lista de obras ficam fora do marco principal */}
                    <main
                      className={cn(
                        "flex h-full flex-1 flex-col overflow-hidden",
                        isObrasExpanded || larguraAnimando
                          ? "opacity-0 transition-none"
                          : "opacity-100 transition-opacity duration-150 motion-reduce:transition-none",
                      )}
                    >
                      {currentRoute && !isMapaObras && (
                        <header
                          className="@container group pointer-events-auto relative mb-2 flex w-full shrink-0 items-start justify-between"
                        >
                          <div
                            className={cn(
                              "flex flex-col gap-1 ease-suave transition-[padding] duration-(--duracao-media) motion-reduce:transition-none group-has-[[data-expandida=true]]:pt-14",
                              isMobile ? "max-w-full px-4 pt-4" : "max-w-[60%] px-4 pb-2 pt-6"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {currentRoute.icon && (
                                <div className="text-secondary-foreground">
                                  {React.cloneElement(
                                    currentRoute.icon as React.ReactElement<any>,
                                    {
                                      size: isMobile ? 20 : 24,
                                    }
                                  )}
                                </div>
                              )}

                              <Typography
                                variant={isMobile ? "text-lg" : "text-2xl"}
                                className="font-semibold text-secondary-foreground"
                              >
                                {currentRoute.titulo || currentRoute.label}
                              </Typography>
                            </div>

                            {currentRoute.description && (
                              <Typography
                                variant={isMobile ? "text-2xs" : "text-sm"}
                                className={cn(
                                  "leading-relaxed text-secondary-foreground",
                                  isMobile && "line-clamp-2 max-h-[33px] overflow-hidden"
                                )}
                              >
                                {currentRoute.description}
                              </Typography>
                            )}
                          </div>

                          <div className={cn("flex shrink-0 items-start pr-2", isMobile && "pt-4")}>
                            {/* Slot para ações da página (ex.: exportar), preenchido via portal pelo CustomTable */}
                            <div
                              id="acoes-cabecalho"
                              className="ease-suave transition-opacity duration-(--duracao-media) motion-reduce:transition-none group-has-[[data-expandida=true]]:pointer-events-none group-has-[[data-expandida=true]]:opacity-0"
                            />
                            {!isMobile && (
                              <div className="flex w-[300px] justify-end @max-[36rem]:w-[208px] xl:w-[380px]">
                                <SearchBox filters={filters} />
                              </div>
                            )}
                          </div>
                        </header>
                      )}

                      <div className={cn(
                        "relative h-full w-full flex-1 overflow-hidden",
                        isMobile && !isMapaObras && "px-2 pt-4 mb-2"
                      )}>
                        {children}
                      </div>
                    </main>
                    {isMapaObras && (
                      <ObrasSidebar
                        className="pointer-events-auto"
                        config={mapaObrasData?.sidebar}
                        selectedObraId={selectedWork?.id}
                        isExpanded={isObrasExpanded}
                        larguraAnimando={larguraAnimando}
                        onToggleExpand={() => {
                          setLarguraAnimando(true);
                          setIsObrasExpanded(!isObrasExpanded);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              {isMobile && (
                <div className="pointer-events-auto absolute left-2 right-2 top-4 z-50 flex items-center gap-2 py-2">
                  <SidebarTrigger className="shrink-0 text-foreground" />
                  <div className="min-w-0 flex-1">
                    <SearchBox isMobile filters={filters} />
                  </div>
                  {filters.length > 0 && (
                    <div className="shrink-0">
                      <FilterSheet
                        filters={filters}
                        fieldsWithSelections={currentSelections.map((s) => s.field)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarProvider>
      <Aviso />
    </div>
    {carregador}
    </>
  );
};

export default Layout;
