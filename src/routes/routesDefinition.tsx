import type { ReactElement } from "react";
import { AnaliseCustomizada } from "@/pages/AnaliseCustomizada/AnaliseCustomizada";
import { MapaObras } from "@/pages/MapaObras/MapaObras";
import { TabelaPagina } from "@/pages/TabelaPagina/TabelaPagina";
import { ClipboardPen, Construction, Map, Shapes } from "lucide-react";

const default_description =
  "Encontre dados sobre obras da SINFRA pelo estado de Mato Grosso.";

export interface RouteDefinition {
  label: string;
  href: string;
  element: ReactElement;
  // Título do cabeçalho da página, quando difere do rótulo do menu
  titulo?: string;
  icon?: ReactElement;
  description?: string;
}

const obras = <TabelaPagina jsonUrl="./pages/obras.json" />;
const contratos = <TabelaPagina jsonUrl="./pages/contratos.json" />;

export const routesDefinition: RouteDefinition[] = [
  {
    label: "Mapa de Obras",
    href: "/mapa-de-obras",
    description: default_description,
    element: <MapaObras />,
    icon: <Map size={16} />,
  },
  {
    label: "Obras",
    href: "/obras",
    element: obras,
    description: default_description,
    icon: <Construction size={16} />,
    titulo: "Tabela de Obras",
  },
  {
    label: "Contratos",
    href: "/contratos",
    description: default_description,
    element: contratos,
    icon: <ClipboardPen size={16} />,
    titulo: "Tabela de Contratos",
  },
  {
    label: "Análise Customizada",
    href: "/analise-customizada",
    description: default_description,
    element: <AnaliseCustomizada />,
    icon: <Shapes size={16} />,
  },
];
