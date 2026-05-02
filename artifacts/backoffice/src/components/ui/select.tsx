import * as React from "react";
import {
  Select as AriaSelect,
  SelectValue,
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Label,
} from "react-aria-components";
import { ChevronDown, Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface SelectProps {
  label?: string;
  placeholder?: string;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ label, placeholder = "Select an option", className, value, onValueChange, children, disabled }, ref) => {
    return (
      <AriaSelect
        selectedKey={value}
        onSelectionChange={(key) => onValueChange?.(String(key))}
        isDisabled={disabled}
        className="flex flex-col gap-1.5"
      >
        {label && <Label className="text-sm font-medium text-color-text-secondary">{label}</Label>}
        <Button
          ref={ref}
          className={cx(
            "flex h-11 w-full items-center justify-between gap-2 rounded-lg",
            "border border-color-border-primary bg-color-bg-primary px-3.5 py-2.5",
            "text-sm text-color-text-primary shadow-xs",
            "focus:outline-none focus:ring-2 focus:ring-color-focus-ring focus:border-color-border-brand",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            className,
          )}
        >
          <SelectValue className="flex-1 text-left data-[placeholder]:text-color-text-placeholder" />
          <ChevronDown className="w-4 h-4 text-color-fg-quaternary shrink-0" aria-hidden />
        </Button>
        <Popover className="z-50 w-[--trigger-width] overflow-auto rounded-lg border border-color-border-secondary bg-color-bg-primary shadow-lg animate-in fade-in-0 zoom-in-95">
          <ListBox className="p-1 outline-none max-h-60 overflow-auto">
            {children}
          </ListBox>
        </Popover>
      </AriaSelect>
    );
  }
);
Select.displayName = "Select";

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function SelectItem({ value, children, className }: SelectItemProps) {
  return (
    <ListBoxItem
      id={value}
      textValue={typeof children === "string" ? children : value}
      className={cx(
        "relative flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 text-sm",
        "text-color-text-primary outline-none transition-colors",
        "hover:bg-color-bg-secondary focus:bg-color-bg-secondary",
        "selected:font-medium",
        className,
      )}
    >
      {({ isSelected }) => (
        <>
          <span>{children}</span>
          {isSelected && <Check className="w-4 h-4 text-color-fg-brand-primary" aria-hidden />}
        </>
      )}
    </ListBoxItem>
  );
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectTrigger = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <span className={className}>{children}</span>
);
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cx("px-2 py-1 text-xs font-semibold text-color-text-tertiary", className)}>{children}</span>
);
const SelectSeparator = ({ className }: { className?: string }) => (
  <div className={cx("-mx-1 my-1 h-px bg-color-border-secondary", className)} />
);
const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectGroup,
  SelectItem,
  SelectContent,
  SelectLabel,
  SelectTrigger,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
export type { SelectProps };
