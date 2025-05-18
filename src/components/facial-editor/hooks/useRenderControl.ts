
import { useRef, useEffect } from 'react';

/**
 * Hook to control and limit component re-renders
 */
export const useRenderControl = (name: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const mountedRef = useRef(false);
  
  // Track render count and frequency
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    
    // Only log if component is already mounted (skip initial render)
    if (mountedRef.current) {
      renderCountRef.current += 1;
      
      // Log excessive renders (more than 3 renders in a second)
      if (timeSinceLastRender < 1000 && renderCountRef.current % 5 === 0) {
        console.warn(
          `[RenderControl] ${name} re-rendering too frequently: ${renderCountRef.current} renders, ` +
          `${Math.round(timeSinceLastRender)}ms since last render`
        );
      }
      
      // Reset counter every 5 seconds
      if (timeSinceLastRender > 5000) {
        renderCountRef.current = 0;
      }
    } else {
      mountedRef.current = true;
    }
    
    lastRenderTimeRef.current = now;
  });
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  return {
    renderCount: renderCountRef.current
  };
};
