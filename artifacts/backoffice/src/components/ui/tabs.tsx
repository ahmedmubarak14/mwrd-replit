import * as React from "react";
import { Tabs as AriaTabs, TabList, Tab, TabPanel } from "react-aria-components";
import { cx } from "@/utils/cx";

const Tabs = React.forwardRef<
  React.ElementRef<typeof AriaTabs>,
  React.ComponentPropsWithoutRef<typeof AriaTabs>
>(({ className, ...props }, ref) => (
  <AriaTabs ref={ref} className={cx("flex flex-col", className)} {...props} />
));
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabList>,
  React.ComponentPropsWithoutRef<typeof TabList>
>(({ className, ...props }, ref) => (
  <TabList
    ref={ref}
    className={cx(
      "flex items-center border-b border-color-border-secondary gap-1",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof Tab>,
  React.ComponentPropsWithoutRef<typeof Tab>
>(({ className, ...props }, ref) => (
  <Tab
    ref={ref}
    className={cx(
      "relative inline-flex items-center justify-center gap-2 px-1 pb-3 pt-0 text-sm font-medium",
      "text-color-text-tertiary outline-none transition-colors cursor-pointer",
      "hover:text-color-text-secondary",
      "selected:text-color-fg-brand-primary",
      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full",
      "after:bg-transparent selected:after:bg-color-fg-brand-primary",
      "focus-visible:rounded focus-visible:ring-2 focus-visible:ring-color-focus-ring",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabPanel>,
  React.ComponentPropsWithoutRef<typeof TabPanel>
>(({ className, ...props }, ref) => (
  <TabPanel
    ref={ref}
    className={cx("mt-4 outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
