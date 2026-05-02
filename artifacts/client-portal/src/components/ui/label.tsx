import * as React from "react";
import { Label as AriaLabel } from "react-aria-components";
import { cx } from "@/utils/cx";

interface LabelProps extends React.ComponentPropsWithoutRef<typeof AriaLabel> {
  required?: boolean;
}

const Label = React.forwardRef<React.ElementRef<typeof AriaLabel>, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <AriaLabel
      ref={ref}
      className={cx(
        "text-sm font-medium text-color-text-secondary",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-color-text-error-primary">*</span>}
    </AriaLabel>
  )
);
Label.displayName = "Label";

export { Label };
