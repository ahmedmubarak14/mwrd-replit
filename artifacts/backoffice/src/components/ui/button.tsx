import * as React from "react";
import { cx } from "@/utils/cx";

type ButtonColor = "primary" | "secondary" | "tertiary" | "error" | "brand";
type ButtonSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  size?: ButtonSize;
  destructive?: boolean;
  iconLeading?: React.ElementType;
  iconTrailing?: React.ElementType;
  iconOnly?: boolean;
  asChild?: boolean;
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "link" | "destructive" | "outline";
}

const colorMap: Record<string, string> = {
  primary: "bg-color-bg-primary text-color-text-primary border border-color-border-primary shadow-xs hover:bg-color-bg-primary_hover",
  brand: "bg-color-bg-brand-solid text-color-text-primary border border-color-bg-brand-solid shadow-xs hover:bg-color-bg-brand-solid_hover",
  secondary: "bg-color-bg-secondary text-color-fg-secondary border border-color-border-primary shadow-xs hover:bg-color-bg-secondary_hover",
  tertiary: "bg-transparent text-color-fg-tertiary hover:bg-color-bg-secondary_hover",
  error: "bg-color-bg-error-solid text-color-text-white border border-color-bg-error-solid shadow-xs hover:bg-color-bg-error-solid_hover",
};

const sizeMap: Record<string, string> = {
  sm: "h-9 px-3.5 py-2 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 py-2.5 text-sm gap-1.5 rounded-lg",
  lg: "h-11 px-4.5 py-2.5 text-md gap-2 rounded-lg",
  xl: "h-12 px-5 py-3 text-md gap-2 rounded-lg",
  "2xl": "h-15 px-7 py-4 text-lg gap-3 rounded-xl",
};

const iconSizeMap: Record<string, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-5 h-5",
  xl: "w-5 h-5",
  "2xl": "w-6 h-6",
};

function variantToColor(variant?: ButtonProps["variant"]): ButtonColor {
  if (!variant || variant === "primary") return "primary";
  if (variant === "destructive") return "error";
  if (variant === "secondary") return "secondary";
  if (variant === "ghost" || variant === "tertiary") return "tertiary";
  return "primary";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    color,
    size = "md",
    destructive,
    iconLeading: IconLeading,
    iconTrailing: IconTrailing,
    iconOnly,
    children,
    variant,
    ...props
  }, ref) => {
    const resolvedColor = color ?? (destructive ? "error" : variantToColor(variant));
    const colorClasses = colorMap[resolvedColor] ?? colorMap.primary;
    const sizeClasses = sizeMap[size] ?? sizeMap.md;
    const iconCls = iconSizeMap[size] ?? iconSizeMap.md;

    return (
      <button
        ref={ref}
        className={cx(
          "inline-flex items-center justify-center font-semibold transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-focus-ring focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          iconOnly && "aspect-square",
          colorClasses,
          sizeClasses,
          className,
        )}
        {...props}
      >
        {IconLeading && <IconLeading className={iconCls} aria-hidden />}
        {children}
        {IconTrailing && <IconTrailing className={iconCls} aria-hidden />}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };

export function buttonVariants({ variant = "primary", size = "md" }: { variant?: string; size?: string } = {}) {
  const colorClasses = colorMap[variantToColor(variant as ButtonProps["variant"])] ?? colorMap.primary;
  const sizeClasses = sizeMap[size] ?? sizeMap.md;
  return cx(
    "inline-flex items-center justify-center font-semibold transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-focus-ring focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-50",
    colorClasses,
    sizeClasses,
  );
}
