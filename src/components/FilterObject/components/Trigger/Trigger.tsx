import { ChevronDown } from "lucide-react";
import Typography from "../../../Typography/Typography";
import { Badge } from "@/components/shadcn/badge";

type TriggerProps = {
  label: string;
  selectedCount: number;
  isOpen?: boolean;
};
export const Trigger: React.FC<TriggerProps> = ({
  label,
  selectedCount,
  isOpen,
}) => {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-1.5 rounded-md">
      <Typography variant="text-sm" className="min-w-0 flex-1 truncate text-start">
        {label}
      </Typography>
      {selectedCount > 0 && (
        <Badge
          variant="destructive"
          className="size-4 justify-center p-0 font-medium text-white/90"
        >
          {selectedCount}
        </Badge>
      )}
      <ChevronDown
        className={`h-4 flex-shrink-0 cursor-pointer ${isOpen ? "rotate-180" : ""
          }`}
      />
    </div>
  );
};
