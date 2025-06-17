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
        "peer data-[state=checked]:bg-[#2563ff] data-[state=unchecked]:bg-[#cad5ff]/60 focus-visible:ring-ring/50 inline-flex h-6 w-12 shrink-0 items-center rounded-full shadow-sm transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 p-0.5 min-w-[3rem] max-w-[3rem]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-white pointer-events-none block h-5 w-5 rounded-full ring-0 transition-transform duration-200 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0 shadow-sm",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
