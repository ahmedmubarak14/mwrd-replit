import * as React from "react";
import { cx } from "@/utils/cx";

type BadgeColor = "brand" | "success" | "error" | "warning" | "gray" | "blue";
type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  size?: BadgeSize;
  dot?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "pending" | "muted";
}

const colorClasses: Record<BadgeColor, string> = {
  brand: "bg-color-utility-brand-50 text-color-fg-brand-primary border border-color-utility-brand-200",
  success: "bg-color-bg-success-primary text-color-text-success-primary border border-color-green-200",
  error: "bg-color-bg-error-primary text-color-text-error-primary border border-color-red-200",
  warning: "bg-color-bg-warning-primary text-color-text-warning-primary border border-color-yellow-200",
  gray: "bg-color-bg-secondary text-color-fg-tertiary border border-color-border-secondary",
  blue: "bg-color-utility-blue-50 text-color-utility-blue-700 border border-color-blue-200",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs gap-1 rounded-full",
  md: "px-2.5 py-0.5 text-xs gap-1.5 rounded-full",
  lg: "px-3 py-1 text-sm gap-1.5 rounded-full",
};

const dotColorClasses: Record<BadgeColor, string> = {
  brand: "bg-color-fg-brand-primary",
  success: "bg-color-text-success-primary",
  error: "bg-color-text-error-primary",
  warning: "bg-color-text-warning-primary",
  gray: "bg-color-fg-tertiary",
  blue: "bg-color-utility-blue-700",
};

function variantToColor(variant?: BadgeProps["variant"]): BadgeColor {
  if (!variant || variant === "default") return "brand";
  if (variant === "secondary" || variant === "muted") return "gray";
  if (variant === "destructive") return "error";
  if (variant === "success") return "success";
  if (variant === "warning") return "warning";
  if (variant === "info") return "blue";
  if (variant === "pending") return "blue";
  if (variant === "outline") return "gray";
  return "gray";
}

function Badge({ className, color, size = "md", dot, children, variant, ...props }: BadgeProps) {
  const resolvedColor = color ?? variantToColor(variant);
  return (
    <span
      className={cx(
        "inline-flex items-center font-medium whitespace-nowrap",
        colorClasses[resolvedColor],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cx("w-1.5 h-1.5 rounded-full shrink-0", dotColorClasses[resolvedColor])} aria-hidden />
      )}
      {children}
    </span>
  );
}

export { Badge };

export function badgeVariants({ variant = "default", size = "md" }: { variant?: string; size?: string } = {}) {
  const resolvedColor = variantToColor(variant as BadgeProps["variant"]);
  return cx(
    "inline-flex items-center font-medium whitespace-nowrap",
    colorClasses[resolvedColor],
    sizeClasses[size as BadgeSize] ?? sizeClasses.md,
  );
}
