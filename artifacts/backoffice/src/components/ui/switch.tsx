import * as React from "react";
import { Switch as AriaSwitch } from "react-aria-components";
import { cx } from "@/utils/cx";

const Switch = React.forwardRef<
  React.ElementRef<typeof AriaSwitch>,
  React.ComponentPropsWithoutRef<typeof AriaSwitch> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <AriaSwitch
    ref={ref}
    isSelected={checked}
    onChange={onCheckedChange}
    className={cx("group inline-flex items-center cursor-pointer outline-none", className)}
    {...props}
  >
    {({ isSelected }) => (
      <div
        className={cx(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent",
          "shadow-sm transition-colors duration-200",
          "focus-visible:ring-2 focus-visible:ring-color-focus-ring",
          "group-disabled:cursor-not-allowed group-disabled:opacity-50",
          isSelected ? "bg-color-bg-brand-solid" : "bg-color-border-primary",
        )}
      >
        <span
          className={cx(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            isSelected ? "translate-x-4" : "translate-x-0",
          )}
        />
      </div>
    )}
  </AriaSwitch>
));
Switch.displayName = "Switch";

export { Switch };
