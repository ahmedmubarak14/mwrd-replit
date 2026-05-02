import * as React from "react";
import {
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Separator,
  Section,
  Header,
} from "react-aria-components";
import { Check, ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";

const DropdownMenu = MenuTrigger;
const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuGroup = Section;
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const menuContentClasses = [
  "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-color-border-secondary",
  "bg-color-bg-primary shadow-lg p-1",
  "data-[entering]:animate-in data-[exiting]:animate-out",
  "data-[entering]:fade-in-0 data-[exiting]:fade-out-0",
  "data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95",
].join(" ");

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  { className?: string; sideOffset?: number; children: React.ReactNode; align?: string }
>(({ className, sideOffset = 4, children }, ref) => (
  <Popover
    offset={sideOffset}
    className={cx(menuContentClasses, className)}
  >
    <Menu className="outline-none">
      {children}
    </Menu>
  </Popover>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps {
  className?: string;
  inset?: boolean;
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, inset, children, onSelect, disabled }, ref) => (
    <MenuItem
      onAction={onSelect}
      isDisabled={disabled}
      className={cx(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        "text-color-text-primary outline-none transition-colors",
        "hover:bg-color-bg-secondary focus:bg-color-bg-secondary",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        inset && "pl-8",
        className,
      )}
    >
      {children}
    </MenuItem>
  )
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  { className?: string; children: React.ReactNode; checked?: boolean; onCheckedChange?: (c: boolean) => void }
>(({ className, children, checked, onCheckedChange }, ref) => (
  <MenuItem
    className={cx(
      "relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm",
      "text-color-text-primary outline-none transition-colors hover:bg-color-bg-secondary",
      className,
    )}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check className="h-4 w-4 text-color-fg-brand-primary" />}
    </span>
    {children}
  </MenuItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  { className?: string; children: React.ReactNode }
>(({ className, children }, ref) => (
  <MenuItem
    className={cx(
      "relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm",
      "text-color-text-primary outline-none transition-colors hover:bg-color-bg-secondary",
      className,
    )}
  >
    {children}
  </MenuItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = ({ className, inset, children }: { className?: string; inset?: boolean; children: React.ReactNode }) => (
  <Header
    className={cx(
      "px-2 py-1.5 text-xs font-semibold text-color-text-tertiary uppercase tracking-wide",
      inset && "pl-8",
      className,
    )}
  >
    {children}
  </Header>
);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <Separator className={cx("-mx-1 my-1 h-px bg-color-border-secondary", className)} />
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cx("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
