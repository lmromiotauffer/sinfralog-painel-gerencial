import Typography from "@/components/Typography/Typography";
import { cn } from "@/shared/utils/tailwind/cn";

interface InfoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
}

const InfoItem = ({ label, value, className, ...props }: InfoItemProps) => (
  <div className={cn("flex h-fit items-center gap-1", className)} {...props}>
    <Typography
      variant="text-2xs"
      className="text-muted-foreground font-normal"
      title={label}
    >
      {label}
    </Typography>
    <Typography
      variant="text-2xs"
      className="text-foreground truncate font-medium"
      title={value}
    >
      {value}
    </Typography>
  </div>
);

export default InfoItem;
