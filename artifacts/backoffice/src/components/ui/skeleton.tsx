import * as React from "react";
import { cx } from "@/utils/cx";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("animate-pulse rounded-lg bg-color-bg-tertiary", className)}
      {...props}
    />
  );
}

export { Skeleton };
