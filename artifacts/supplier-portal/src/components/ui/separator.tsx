import * as React from "react";
import { cx } from "@/utils/cx";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cx(
        "shrink-0 bg-color-border-secondary",
        orientation === "horizontal" ? "h-px w-full my-2" : "h-full w-px mx-2",
        className,
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };
