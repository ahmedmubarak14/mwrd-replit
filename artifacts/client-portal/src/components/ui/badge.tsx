import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary border border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary-border",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20",
        outline:
          "text-foreground border [border-color:var(--badge-outline)] bg-transparent",
        success:
          "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400",
        warning:
          "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400",
        info:
          "bg-sky-500/10 text-sky-700 border border-sky-500/20 dark:text-sky-400",
        pending:
          "bg-violet-500/10 text-violet-700 border border-violet-500/20 dark:text-violet-400",
        muted:
          "bg-muted text-muted-foreground border border-muted-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
