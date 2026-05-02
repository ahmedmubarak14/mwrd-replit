import * as React from "react";
import { cx } from "@/utils/cx";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};
const DropdownCtx = React.createContext<Ctx | null>(null);

function useDropdown() {
  const ctx = React.useContext(DropdownCtx);
  if (!ctx) throw new Error("DropdownMenu components must be used inside <DropdownMenu>");
  return ctx;
}

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);
  return (
    <DropdownCtx.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownCtx.Provider>
  );
};

const DropdownMenuTrigger = ({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) => {
  const { open, setOpen, triggerRef } = useDropdown();
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) handleClick(e);
      },
      "aria-haspopup": "menu",
      "aria-expanded": open,
    });
  }
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={handleClick}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      {children}
    </button>
  );
};

interface ContentProps {
  className?: string;
  sideOffset?: number;
  children: React.ReactNode;
  align?: "start" | "end" | "center";
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, children, align = "start", sideOffset = 4 }, ref) => {
    const { open, setOpen, triggerRef } = useDropdown();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

    React.useEffect(() => {
      if (!open) return;
      const onDocClick = (ev: MouseEvent) => {
        const target = ev.target as Node;
        if (
          contentRef.current?.contains(target) ||
          triggerRef.current?.contains(target)
        )
          return;
        setOpen(false);
      };
      const onEsc = (ev: KeyboardEvent) => ev.key === "Escape" && setOpen(false);
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onEsc);
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("keydown", onEsc);
      };
    }, [open, setOpen, triggerRef]);

    if (!open) return null;
    const alignClass =
      align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";

    return (
      <div
        ref={contentRef}
        role="menu"
        style={{ marginTop: sideOffset }}
        className={cx(
          "absolute z-50 min-w-[10rem] top-full rounded-lg border border-[rgb(228,231,236)] bg-white shadow-lg p-1",
          alignClass,
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
DropdownMenuContent.displayName = "DropdownMenuContent";

interface ItemProps {
  className?: string;
  inset?: boolean;
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLButtonElement, ItemProps>(
  ({ className, inset, children, onSelect, disabled }, ref) => {
    const { setOpen } = useDropdown();
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (disabled) return;
          onSelect?.();
          setOpen(false);
        }}
        className={cx(
          "w-full text-left flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm",
          "text-[rgb(52,64,84)] outline-none transition-colors",
          "hover:bg-[rgb(249,250,251)] focus:bg-[rgb(249,250,251)]",
          "disabled:pointer-events-none disabled:opacity-50",
          inset && "pl-8",
          className,
        )}
      >
        {children}
      </button>
    );
  },
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = ({
  className,
  inset,
  children,
}: {
  className?: string;
  inset?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={cx(
      "px-2 py-1.5 text-xs font-semibold text-[rgb(102,112,133)] uppercase tracking-wide",
      inset && "pl-8",
      className,
    )}
  >
    {children}
  </div>
);

const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <div className={cx("-mx-1 my-1 h-px bg-[rgb(228,231,236)]", className)} />
);

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cx("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
);

const Passthrough = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  Passthrough as DropdownMenuGroup,
  Passthrough as DropdownMenuPortal,
  Passthrough as DropdownMenuSub,
  Passthrough as DropdownMenuSubContent,
  Passthrough as DropdownMenuSubTrigger,
  Passthrough as DropdownMenuRadioGroup,
  DropdownMenuItem as DropdownMenuCheckboxItem,
  DropdownMenuItem as DropdownMenuRadioItem,
};
