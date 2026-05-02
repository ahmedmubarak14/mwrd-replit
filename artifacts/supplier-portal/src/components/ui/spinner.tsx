import * as React from "react";
import { Loading01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loading01
      role="status"
      aria-label="Loading"
      className={cx("size-5 animate-spin text-color-fg-brand-primary", className)}
      {...props}
    />
  );
}

export { Spinner };
