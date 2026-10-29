import { SVGProps } from "react";

import EllipseBoxesIcon from "../../components/KPI/assets/ellipse-boxes.svg?react";
import EllipseCoinsIcon from "../../components/KPI/assets/ellipse-coins.svg?react";
import EllipseLayersIcon from "../../components/KPI/assets/ellipse-layers.svg?react";
import EllipsePercentDiamondIcon from "../../components/KPI/assets/ellipse-percent-diamond.svg?react";
import EllipseBlocksIcon from "../../components/KPI/assets/ellipse-blocks.svg?react";
import { Skeleton } from "../shadcn/skeleton";

// Mapeamento dos ícones por nome
const iconMap = {
  "ellipse-boxes": EllipseBoxesIcon,
  "ellipse-coins": EllipseCoinsIcon,
  "ellipse-layers": EllipseLayersIcon,
  "ellipse-percent-diamond": EllipsePercentDiamondIcon,
  "ellipse-blocks": EllipseBlocksIcon,
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  isLoading?: boolean;
}

export const Icon = ({
  name,
  width = 24,
  height = 24,
  className = "",
  isLoading = false,
  ...svgProps
}: IconProps) => {
  if (isLoading) {
    return <Skeleton className={className} style={{ width, height }} />;
  }

  // O nome vem do JSON de configuração, que pode trazer um ícone inexistente
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    console.warn(`Ícone "${name}" não encontrado`);
    return null;
  }

  return (
    <IconComponent
      width={width}
      height={height}
      className={className}
      {...svgProps}
    />
  );
};
