import * as React from "react";
import { ProgressBar } from "react-aria-components";
import { cx } from "@/utils/cx";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressBar>,
  React.ComponentPropsWithoutRef<typeof ProgressBar> & { value?: number }
>(({ className, value = 0, ...props }, ref) => (
  <ProgressBar
    ref={ref}
    value={value}
    className={cx("relative h-2 w-full overflow-hidden rounded-full bg-color-bg-tertiary", className)}
    {...props}
  >
    {() => (
      <div
        className="h-full bg-color-bg-brand-solid transition-all"
        style={{ width: `${value}%` }}
      />
    )}
  </ProgressBar>
));
Progress.displayName = "Progress";

export { Progress };
