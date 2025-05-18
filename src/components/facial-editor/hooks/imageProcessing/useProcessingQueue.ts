
import { useRef, useCallback } from 'react';

export const useProcessingQueue = () => {
  const processingQueuedRef = useRef(false);
  const processingTimeoutRef = useRef<number | null>(null);
  const lastProcessingTimeRef = useRef<number>(0);
  const processCountRef = useRef<number>(0);
  
  // Use requestAnimationFrame for smoother UI updates
  const scheduleProcessing = useCallback((callback: () => void) => {
    return window.requestAnimationFrame(() => {
      try {
        callback();
      } catch (error) {
        console.error("[DEBUG-useProcessingQueue] Error in scheduled processing:", error);
      }
    });
  }, []);
  
  const addToQueue = useCallback(() => {
    processingQueuedRef.current = true;
    
    // Implement rate limiting
    const now = Date.now();
    if (now - lastProcessingTimeRef.current < 750) {
      if (!processingQueuedRef.current) {
        console.log("[DEBUG-useProcessingQueue] Processing too frequent, queueing for later");
        processingQueuedRef.current = true;
        
        // Schedule a single delayed processing to batch rapid changes
        if (processingTimeoutRef.current !== null) {
          window.clearTimeout(processingTimeoutRef.current);
        }
        
        processingTimeoutRef.current = window.setTimeout(() => {
          processingQueuedRef.current = false;
          console.log("[DEBUG-useProcessingQueue] Running delayed processing");
          // The actual processing happens in the parent component
          processingTimeoutRef.current = null;
        }, 800);
      }
    }
    
    // Track processing time and count
    lastProcessingTimeRef.current = now;
    processCountRef.current += 1;
  }, []);
  
  const clearQueue = useCallback(() => {
    processingQueuedRef.current = false;
    if (processingTimeoutRef.current !== null) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, []);
  
  return {
    processingQueued: processingQueuedRef.current,
    setProcessingQueued: (queued: boolean) => { processingQueuedRef.current = queued; },
    scheduleProcessing,
    addToQueue,
    clearQueue
  };
};
