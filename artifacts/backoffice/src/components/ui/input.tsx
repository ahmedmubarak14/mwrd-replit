import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

interface InputFieldProps extends React.ComponentProps<"input"> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, leadingIcon, trailingIcon, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {leadingIcon && (
          <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground/60 [&_svg]:size-4">
            {leadingIcon}
          </div>
        )}
        <Input
          className={cn(
            leadingIcon && "pl-9",
            trailingIcon && "pr-9",
            className
          )}
          ref={ref}
          {...props}
        />
        {trailingIcon && (
          <div className="pointer-events-none absolute right-3 flex items-center text-muted-foreground/60 [&_svg]:size-4">
            {trailingIcon}
          </div>
        )}
      </div>
    )
  }
)
InputField.displayName = "InputField"

export { Input, InputField }
