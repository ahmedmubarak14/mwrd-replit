import * as React from "react";
import { cx } from "@/utils/cx";

type AlertVariant = "default" | "destructive" | "success" | "warning";

const variantClasses: Record<AlertVariant, string> = {
  default: "bg-color-bg-secondary border-color-border-secondary text-color-text-primary [&>svg]:text-color-fg-tertiary",
  destructive: "bg-color-bg-error-primary border-color-border-error text-color-text-error-primary [&>svg]:text-color-text-error-primary",
  success: "bg-color-bg-success-primary border-color-border-secondary text-color-text-success-primary",
  warning: "bg-color-bg-warning-primary border-color-border-secondary text-color-text-warning-primary",
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cx(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        "[&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg]:size-4 [&>svg~*]:pl-7",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cx("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
