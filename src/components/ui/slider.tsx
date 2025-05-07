
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const trackRef = React.useRef<HTMLSpanElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  // Create stable function references with useCallback
  const handleDocumentMouseMove = React.useCallback(() => {
    if (!isDragging || !trackRef.current) return;
    
    console.log("Mouse moving while dragging slider");
    // The actual value update is handled by Radix UI through its own event system
  }, [isDragging]);

  const handleDocumentMouseUp = React.useCallback(() => {
    if (!isDragging) return;
    
    console.log("Mouse up - ending drag");
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
    
    // Call the onValueCommit prop if provided, passing the current value
    if (props.onValueCommit) {
      // Make sure we're passing the array value expected by the function
      props.onValueCommit(props.value || [0]);
    }
  }, [isDragging, props, handleDocumentMouseMove]);

  const handleDocumentTouchMove = React.useCallback((e: TouchEvent) => {
    if (!isDragging || !trackRef.current) return;
    
    // Prevent scrolling while dragging the slider
    e.preventDefault();
    console.log("Touch moving while dragging slider");
    // The actual value update is handled by Radix UI
  }, [isDragging]);

  const handleDocumentTouchEnd = React.useCallback(() => {
    if (!isDragging) return;
    
    console.log("Touch end - ending drag");
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('touchmove', handleDocumentTouchMove, { passive: false } as EventListenerOptions);
    document.removeEventListener('touchend', handleDocumentTouchEnd);
    
    // Call the onValueCommit prop if provided, passing the current value
    if (props.onValueCommit) {
      // Make sure we're passing the array value expected by the function
      props.onValueCommit(props.value || [0]);
    }
  }, [isDragging, props, handleDocumentTouchMove]);
  
  // Handle mouse down to initiate dragging
  const handleMouseDown = React.useCallback(() => {
    console.log("Mouse down on slider track - starting drag");
    setIsDragging(true);
    
    // Add document-level event listeners
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  }, [handleDocumentMouseMove, handleDocumentMouseUp]);

  // Handle touch start to initiate dragging
  const handleTouchStart = React.useCallback(() => {
    console.log("Touch start on slider track - starting drag");
    setIsDragging(true);
    
    // Add document-level event listeners
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false } as EventListenerOptions);
    document.addEventListener('touchend', handleDocumentTouchEnd);
  }, [handleDocumentTouchMove, handleDocumentTouchEnd]);
  
  // Clean up event listeners when component unmounts
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
      console.log("Cleaning up slider event listeners on unmount");
    };
  }, [handleDocumentMouseMove, handleDocumentMouseUp, handleDocumentTouchMove, handleDocumentTouchEnd]);

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
