import * as React from "react";
import { cx } from "@/utils/cx";

const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cx("relative overflow-auto scrollbar-hide", className)} {...props}>
      {children}
    </div>
  )
);
ScrollArea.displayName = "ScrollArea";

const ScrollBar = ({ className, orientation = "vertical" }: { className?: string; orientation?: "vertical" | "horizontal" }) => null;

export { ScrollArea, ScrollBar };
