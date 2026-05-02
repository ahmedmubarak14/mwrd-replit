import * as React from "react";
import { Checkbox as AriaCheckbox } from "react-aria-components";
import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof AriaCheckbox>,
  React.ComponentPropsWithoutRef<typeof AriaCheckbox> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, checked, onCheckedChange, onChange, ...props }, ref) => (
  <AriaCheckbox
    ref={ref}
    isSelected={checked}
    onChange={(val) => {
      onCheckedChange?.(val);
      (onChange as ((val: boolean) => void) | undefined)?.(val);
    }}
    className={cx(
      "group flex items-center gap-2 cursor-pointer outline-none",
      className,
    )}
    {...props}
  >
    {({ isSelected, isIndeterminate }) => (
      <div
        className={cx(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          "focus-visible:ring-2 focus-visible:ring-color-focus-ring",
          isSelected || isIndeterminate
            ? "bg-color-bg-brand-solid border-color-bg-brand-solid"
            : "border-color-border-primary bg-color-bg-primary",
          "group-disabled:cursor-not-allowed group-disabled:opacity-50",
        )}
      >
        {(isSelected || isIndeterminate) && (
          <Check className="h-3 w-3 text-color-neutral-900" aria-hidden />
        )}
      </div>
    )}
  </AriaCheckbox>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
