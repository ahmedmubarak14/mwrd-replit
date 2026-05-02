import * as React from "react";
import { cx } from "@/utils/cx";

const inputBase = [
  "flex w-full rounded-lg border border-color-border-primary bg-color-bg-primary",
  "px-3.5 py-2.5 text-md text-color-text-primary shadow-xs",
  "placeholder:text-color-text-placeholder",
  "focus:outline-none focus:ring-2 focus:ring-color-focus-ring focus:ring-offset-0 focus:border-color-border-brand",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-color-bg-secondary",
  "transition-colors",
].join(" ");

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cx(inputBase, "h-11", className)}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

interface InputFieldProps extends React.ComponentProps<"input"> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  label?: string;
  hint?: string;
  error?: string;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, leadingIcon, trailingIcon, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-color-text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-color-fg-quaternary [&_svg]:size-5">
              {leadingIcon}
            </div>
          )}
          <input
            id={inputId}
            className={cx(
              inputBase,
              "h-11",
              leadingIcon && "pl-10",
              trailingIcon && "pr-10",
              error && "border-color-border-error focus:ring-color-focus-ring-error",
              className,
            )}
            ref={ref}
            {...props}
          />
          {trailingIcon && (
            <div className="pointer-events-none absolute right-3.5 flex items-center text-color-fg-quaternary [&_svg]:size-5">
              {trailingIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-color-text-error-primary">{error}</p>}
        {hint && !error && <p className="text-sm text-color-text-tertiary">{hint}</p>}
      </div>
    );
  }
);
InputField.displayName = "InputField";

export { Input, InputField };
