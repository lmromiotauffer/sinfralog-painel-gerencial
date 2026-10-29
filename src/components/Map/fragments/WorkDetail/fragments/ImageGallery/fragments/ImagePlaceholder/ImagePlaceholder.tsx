import { Camera } from "lucide-react";

export const ImagePlaceholder = () => {
  return (
    <div className="bg-muted/50 border-border/50 text-muted-foreground flex h-[clamp(150px,calc(100dvh-660px),305px)] w-full flex-col items-center justify-center overflow-hidden rounded-lg border">
      <Camera size={32} className="mb-2 opacity-50" />
      <span className="text-sm">Sem fotos disponíveis</span>
    </div>
  );
};
