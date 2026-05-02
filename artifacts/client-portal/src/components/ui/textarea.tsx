import * as React from "react";
import { cx } from "@/utils/cx";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cx(
        "flex min-h-[100px] w-full rounded-lg border border-color-border-primary bg-color-bg-primary",
        "px-3.5 py-2.5 text-md text-color-text-primary shadow-xs resize-y",
        "placeholder:text-color-text-placeholder",
        "focus:outline-none focus:ring-2 focus:ring-color-focus-ring focus:border-color-border-brand",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-color-bg-secondary",
        "transition-colors",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
