
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

// Define valid sizes for the Switch component
type SwitchSize = "default" | "sm" | "lg";

// Extend the original props with our custom size prop
interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: SwitchSize;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = "default", ...props }, ref) => {
  // Size-specific classes
  const sizeClasses = {
    default: "h-6 w-11",
    sm: "h-5 w-9", 
    lg: "h-7 w-[52px]"
  }

  // Size-specific thumb classes
  const thumbSizeClasses = {
    default: "h-5 w-5 data-[state=checked]:translate-x-5",
    sm: "h-4 w-4 data-[state=checked]:translate-x-4",
    lg: "h-6 w-6 data-[state=checked]:translate-x-6"
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        sizeClasses[size],
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
          thumbSizeClasses[size]
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
