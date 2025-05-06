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
  const dragHandlersRef = React.useRef({
    handleDocumentMouseMove: (e: MouseEvent) => {},
    handleDocumentMouseUp: () => {},
    handleDocumentTouchMove: (e: TouchEvent) => {},
    handleDocumentTouchEnd: () => {}
  });

  // Create persistent handlers with useCallback
  const handleDocumentMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    
    // Radix UI handles the actual slider interaction through its own events
    // We just need to keep track of the dragging state
    console.log("Mouse moving while dragging");
  }, [isDragging]);

  const handleDocumentMouseUp = React.useCallback(() => {
    if (!isDragging) return;
    
    console.log("Mouse up - ending drag");
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', dragHandlersRef.current.handleDocumentMouseMove);
    document.removeEventListener('mouseup', dragHandlersRef.current.handleDocumentMouseUp);
  }, [isDragging]);

  const handleDocumentTouchMove = React.useCallback((e: TouchEvent) => {
    if (!isDragging || !trackRef.current) return;
    
    // For touch events, prevent scrolling while dragging the slider
    e.preventDefault();
    console.log("Touch moving while dragging");
    
    // Radix UI handles the actual slider interaction through its own events
  }, [isDragging]);

  const handleDocumentTouchEnd = React.useCallback(() => {
    if (!isDragging) return;
    
    console.log("Touch end - ending drag");
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('touchmove', dragHandlersRef.current.handleDocumentTouchMove);
    document.removeEventListener('touchend', dragHandlersRef.current.handleDocumentTouchEnd);
  }, [isDragging]);

  // Update the ref whenever the handlers change
  React.useEffect(() => {
    dragHandlersRef.current = {
      handleDocumentMouseMove,
      handleDocumentMouseUp,
      handleDocumentTouchMove,
      handleDocumentTouchEnd
    };
  }, [handleDocumentMouseMove, handleDocumentMouseUp, handleDocumentTouchMove, handleDocumentTouchEnd]);

  // Clean up any lingering event listeners on unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', dragHandlersRef.current.handleDocumentMouseMove);
      document.removeEventListener('mouseup', dragHandlersRef.current.handleDocumentMouseUp);
      document.removeEventListener('touchmove', dragHandlersRef.current.handleDocumentTouchMove);
      document.removeEventListener('touchend', dragHandlersRef.current.handleDocumentTouchEnd);
    };
  }, []);

  // Track mouse down to initiate dragging
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    console.log("Mouse down on slider track - starting drag");
    setIsDragging(true);
    
    // Add document-level event listeners
    document.addEventListener('mousemove', dragHandlersRef.current.handleDocumentMouseMove);
    document.addEventListener('mouseup', dragHandlersRef.current.handleDocumentMouseUp);
  }, []);

  // Track touch start to initiate dragging
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    console.log("Touch start on slider track - starting drag");
    setIsDragging(true);
    
    // Add document-level event listeners
    document.addEventListener('touchmove', dragHandlersRef.current.handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', dragHandlersRef.current.handleDocumentTouchEnd);
  }, []);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      onValueCommit={props.onValueCommit}
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
