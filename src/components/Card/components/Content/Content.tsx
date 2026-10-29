import { HTMLAttributes } from "react";

import { cn } from "@/shared/utils/tailwind/cn";

export type ContentProps = HTMLAttributes<HTMLDivElement>;

const Content = ({ className, children, ...props }: ContentProps) => (
  <div className={cn("flex-1 overflow-y-auto flex flex-col", className)} {...props}>
    {children}
  </div>
);

export default Content;
