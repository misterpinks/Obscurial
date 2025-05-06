
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Create refs for the track and thumb elements
  const trackRef = React.useRef<HTMLSpanElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Handle mouse and touch events for better slider interaction
  React.useEffect(() => {
    // Clean up function to remove event listeners
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, []);

  // Document-level event handlers for drag operations that may go outside the slider
  const handleDocumentMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    // Let Radix UI handle the actual slider logic
  }, [isDragging]);

  const handleDocumentMouseUp = React.useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
  }, [isDragging, handleDocumentMouseMove]);

  const handleDocumentTouchMove = React.useCallback((e: TouchEvent) => {
    if (!isDragging || !trackRef.current) return;
    // Let Radix UI handle the actual slider logic through its own events
  }, [isDragging]);

  const handleDocumentTouchEnd = React.useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    document.removeEventListener('touchmove', handleDocumentTouchMove);
    document.removeEventListener('touchend', handleDocumentTouchEnd);
  }, [isDragging, handleDocumentTouchMove]);

  // Track mouse down to initiate dragging
  const handleMouseDown = React.useCallback(() => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  }, [handleDocumentMouseMove, handleDocumentMouseUp]);

  // Track touch start to initiate dragging
  const handleTouchStart = React.useCallback(() => {
    setIsDragging(true);
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd);
  }, [handleDocumentTouchMove, handleDocumentTouchEnd]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track 
        ref={trackRef}
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:border-editor-accent z-[9999]" 
      />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
