import * as React from "react";
import {
  Modal,
  ModalOverlay,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading,
} from "react-aria-components";
import { X } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => (
  <AriaDialogTrigger isOpen={open} onOpenChange={onOpenChange}>
    {children}
  </AriaDialogTrigger>
);

const DialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DialogClose = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <span className={className}>{children}</span>
);

const DialogOverlay = ({ className }: { className?: string }) => (
  <ModalOverlay className={cx("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0", className)} />
);

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onCloseAutoFocus?: (e: Event) => void;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className }, ref) => (
    <Modal
      className={cx(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
        "data-[entering]:animate-in data-[exiting]:animate-out",
        "data-[entering]:fade-in-0 data-[exiting]:fade-out-0",
        "data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95",
      )}
    >
      <ModalOverlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0" />
      <AriaDialog
        ref={ref}
        className={cx(
          "relative z-50 flex flex-col gap-4 rounded-xl border border-color-border-secondary",
          "bg-color-bg-primary p-6 shadow-xl outline-none",
          className,
        )}
      >
        {({ close }) => (
          <>
            {children}
            <button
              onClick={close}
              className="absolute right-4 top-4 rounded-sm opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-focus-ring"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </>
        )}
      </AriaDialog>
    </Modal>
  )
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("flex flex-col gap-1", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("flex items-center justify-end gap-3 pt-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <Heading slot="title" className={cx("text-lg font-semibold text-color-text-primary", className)} {...props}>
    {children}
  </Heading>
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cx("text-sm text-color-text-tertiary", className)} {...props} />
);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
