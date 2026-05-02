import * as React from "react";

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled, className, onClick, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onCheckedChange?.(!checked);
      }}
      className={
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors " +
        "focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)] focus:ring-offset-2 " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        (checked ? "bg-[rgb(255,109,67)] " : "bg-[rgb(228,231,235)] ") +
        (className ?? "")
      }
      {...props}
    >
      <span
        className={
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform " +
          (checked ? "translate-x-5" : "translate-x-0.5")
        }
      />
    </button>
  )
);
Switch.displayName = "Switch";
