"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-[#1B59FA] data-[state=unchecked]:bg-gray-200 focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-gray-600 inline-flex h-6 w-12 shrink-0 items-center rounded-lg border border-transparent shadow-sm transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-white pointer-events-none block size-5 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[1.5rem] data-[state=unchecked]:translate-x-0.5 shadow-sm",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
