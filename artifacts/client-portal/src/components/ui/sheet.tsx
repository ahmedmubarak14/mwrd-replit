import * as React from "react";
import {
  Modal,
  ModalOverlay,
  Dialog,
  DialogTrigger,
  Heading,
} from "react-aria-components";
import { X } from "@untitledui/icons";
import { cx } from "@/utils/cx";

const Sheet = DialogTrigger;
const SheetTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SheetClose = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const SheetPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const SheetOverlay = ({ className }: { className?: string }) => (
  <ModalOverlay className={cx("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)} />
);

const sideClasses = {
  right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[entering]:slide-in-from-right data-[exiting]:slide-out-to-right",
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[entering]:slide-in-from-left data-[exiting]:slide-out-to-left",
  top: "inset-x-0 top-0 border-b data-[entering]:slide-in-from-top data-[exiting]:slide-out-to-top",
  bottom: "inset-x-0 bottom-0 border-t data-[entering]:slide-in-from-bottom data-[exiting]:slide-out-to-bottom",
};

interface SheetContentProps {
  side?: keyof typeof sideClasses;
  className?: string;
  children: React.ReactNode;
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children }, ref) => (
    <Modal
      className={cx(
        "fixed z-50 bg-color-bg-primary shadow-xl outline-none",
        "data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:duration-300 data-[exiting]:duration-200",
        sideClasses[side],
        className,
      )}
    >
      <ModalOverlay className="fixed inset-0 z-40 bg-black/60 data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0" />
      <Dialog ref={ref} className="flex h-full flex-col outline-none p-6">
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
      </Dialog>
    </Modal>
  )
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("flex flex-col gap-2 mb-4", className)} {...props} />
);

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx("flex items-center justify-end gap-3 mt-4", className)} {...props} />
);

const SheetTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <Heading slot="title" className={cx("text-lg font-semibold text-color-text-primary", className)} {...props}>
    {children}
  </Heading>
);

const SheetDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cx("text-sm text-color-text-tertiary", className)} {...props} />
);

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
