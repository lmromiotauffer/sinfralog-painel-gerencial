import { ChevronUp } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/shadcn/drawer";

interface MobileDrawerProps {
  obrasCount: number;
  /** A lista ainda não carregou todas as páginas: a contagem é parcial */
  maisPorCarregar?: boolean;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileDrawer = ({ obrasCount, maisPorCarregar, children, isOpen, onOpenChange }: MobileDrawerProps) => {

  return (
    // 88px: logo acima da barra de KPIs (16px de margem + 66px de altura + 6px)
    <div className="pointer-events-none absolute bottom-[88px] left-0 z-20 w-full px-4">
      <div className="pointer-events-auto">
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="bg-sidebar border-input hover:bg-accent/50 relative flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-3 shadow-md backdrop-blur-[10px] transicao-feedback"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Lista de Obras</span>
                <span className="text-muted-foreground text-xs">
                  ({obrasCount}{maisPorCarregar ? "+" : ""} obras)
                </span>
              </div>
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            </button>
          </DrawerTrigger>
          <DrawerContent
            className="border-input border mx-2 h-[638px] max-h-[85dvh] flex flex-col outline-none"
            style={{ backgroundColor: "var(--colors-custom-components-bg)" }}
          >
            <DrawerHeader className="pb-2 text-left">
              <DrawerTitle className="text-lg font-bold">
                Lista de Obras
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Lista de obras filtradas por tipo
              </DrawerDescription>
            </DrawerHeader>
            <div
              className="flex flex-1 flex-col overflow-hidden overflow-x-hidden [&_*::-webkit-scrollbar]:hidden [&_*]:[scrollbar-width:none]"
            >
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};
