
import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { createWorker, processImageWithWorker, terminateWorker, isWorkerSupported } from '../../utils/workers/workerManager';

interface UseImageProcessingCoreProps {
  originalImage: HTMLImageElement | null;
  initialProcessingDone: boolean;
  autoAnalyze: boolean;
  lastProcessedValues: string;
  setLastProcessedValues: (values: string) => void;
  processImageImpl: () => HTMLCanvasElement | undefined;
  analyzeModifiedImage: () => void;
  isFaceApiLoaded: boolean;
  faceDetection: any;
}

export const useImageProcessingCore = ({
  originalImage,
  initialProcessingDone,
  autoAnalyze,
  lastProcessedValues,
  setLastProcessedValues,
  processImageImpl,
  analyzeModifiedImage,
  isFaceApiLoaded,
  faceDetection
}: UseImageProcessingCoreProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>("");
  const processingQueuedRef = useRef(false);
  const workerRef = useRef<Worker | undefined>(undefined);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const processingTimeoutRef = useRef<number | null>(null);
  const lastProcessingTimeRef = useRef<number>(0);
  const processCountRef = useRef<number>(0);
  const autoAnalyzeRequested = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const hasInitialized = useRef<boolean>(false);
  
  // Prevent console spam - only log once
  if (!hasInitialized.current) {
    console.log("[DEBUG-useImageProcessingCore] Initializing hook, autoAnalyze:", autoAnalyze);
    hasInitialized.current = true;
  }
  
  // Initialize the web worker once
  useEffect(() => {
    if (workerRef.current) {
      return; // Worker already initialized
    }
    
    console.log("[DEBUG-useImageProcessingCore] Setting up web worker");
    if (isWorkerSupported) {
      try {
        // Create worker from the worker file URL
        const workerUrl = new URL('../../utils/workers/imageProcessingWorker.ts', import.meta.url);
        const worker = createWorker(workerUrl.href);
        
        if (worker) {
          // Listen for the ready message
          const readyHandler = (event: MessageEvent) => {
            if (event.data?.status === 'ready') {
              console.log('[DEBUG-useImageProcessingCore] Image processing worker ready');
              setIsWorkerReady(true);
            }
          };
          
          worker.addEventListener('message', readyHandler);
          workerRef.current = worker;
          
          return () => {
            worker.removeEventListener('message', readyHandler);
            terminateWorker(worker);
            workerRef.current = undefined;
            console.log('[DEBUG-useImageProcessingCore] Worker terminated on cleanup');
          };
        }
      } catch (error) {
        console.error('[DEBUG-useImageProcessingCore] Failed to initialize worker:', error);
      }
    } else {
      console.log('[DEBUG-useImageProcessingCore] Web Workers not supported, using main thread processing');
    }
  }, []); // Empty dependency array to run only once
  
  // Use requestAnimationFrame for smoother UI updates
  const scheduleProcessing = useCallback((callback: () => void) => {
    return window.requestAnimationFrame(() => {
      try {
        callback();
      } catch (error) {
        console.error("[DEBUG-useImageProcessingCore] Error in scheduled processing:", error);
      }
    });
  }, []);

  // Debounced process function - created once
  const debouncedProcess = useCallback(
    debounce(() => {
      console.log("[DEBUG-useImageProcessingCore] Debounced process triggered");
      processImage();
    }, 500),
    [] // Empty dependency array to create only once
  );
  
  // Store processImage implementation in a ref to avoid dependency issues
  const processImageImplRef = useRef(processImageImpl);
  useEffect(() => {
    processImageImplRef.current = processImageImpl;
  }, [processImageImpl]);

  // Store analyzeModifiedImage function in a ref to avoid dependency issues
  const analyzeModifiedImageRef = useRef(analyzeModifiedImage);
  useEffect(() => {
    analyzeModifiedImageRef.current = analyzeModifiedImage;
  }, [analyzeModifiedImage]);
  
  // Stable processImage function
  const processImage = useCallback(() => {
    if (!originalImage) {
      console.log("[DEBUG-useImageProcessingCore] No original image to process");
      return;
    }
    
    // If processing is already in progress, queue it and return
    if (isProcessingRef.current) {
      console.log("[DEBUG-useImageProcessingCore] Already processing, queueing request");
      processingQueuedRef.current = true;
      return;
    }
    
    // Clear any existing timeout to avoid processing buildup
    if (processingTimeoutRef.current !== null) {
      window.clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
      console.log("[DEBUG-useImageProcessingCore] Cleared existing processing timeout");
    }
    
    // Implement rate limiting
    const now = Date.now();
    if (now - lastProcessingTimeRef.current < 750) {
      if (!processingQueuedRef.current) {
        console.log("[DEBUG-useImageProcessingCore] Processing too frequent, queueing for later");
        processingQueuedRef.current = true;
        
        // Schedule a single delayed processing to batch rapid changes
        processingTimeoutRef.current = window.setTimeout(() => {
          processingQueuedRef.current = false;
          console.log("[DEBUG-useImageProcessingCore] Running delayed processing");
          processImage();
        }, 800);
      }
      return;
    }
    
    // Track processing time for rate limiting
    lastProcessingTimeRef.current = now;
    processCountRef.current += 1;
    
    // Set processing state
    setIsProcessing(true);
    isProcessingRef.current = true;
    console.log("[DEBUG-useImageProcessingCore] Starting image processing #" + processCountRef.current);
    
    // Use requestAnimationFrame to prevent UI blocking
    scheduleProcessing(() => {
      try {
        // Process the image using our implementation from the ref
        const cleanCanvas = processImageImplRef.current();
        
        // Update clean processed image URL for download
        if (cleanCanvas) {
          try {
            setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
            console.log("[DEBUG-useImageProcessingCore] Generated clean processed image URL");
          } catch (e) {
            console.error("[DEBUG-useImageProcessingCore] Failed to generate data URL:", e);
          }
        }
        
        // Reset auto-analyze request flag to prevent loops
        autoAnalyzeRequested.current = false;
        
        // If we have face data, analyze the modified image with a delay
        // Only if auto-analyze is enabled and limit the frequency
        if (faceDetection && isFaceApiLoaded && autoAnalyze && !processingQueuedRef.current && 
            processCountRef.current % 7 === 0) { // Only analyze every 7th processing
          
          console.log("[DEBUG-useImageProcessingCore] Will analyze on processing count:", processCountRef.current);
          
          // Set flag to track that we've requested analysis
          autoAnalyzeRequested.current = true;
          
          processingTimeoutRef.current = window.setTimeout(() => {
            // Only proceed if we haven't canceled this timer
            if (autoAnalyzeRequested.current) {
              console.log("[DEBUG-useImageProcessingCore] Running delayed analysis after processing");
              analyzeModifiedImageRef.current();
            }
            processingTimeoutRef.current = null;
          }, 3000);
        }
      } catch (error) {
        console.error("[DEBUG-useImageProcessingCore] Error processing image:", error);
      } finally {
        setIsProcessing(false);
        
        // Delay resetting the processing flag to prevent rapid cycling
        window.setTimeout(() => {
          isProcessingRef.current = false;
          console.log("[DEBUG-useImageProcessingCore] Processing complete, flag reset");
        }, 500);
        
        // If there was another process requested while this one was running, run it now
        // but with a delay to prevent rapid cycling
        if (processingQueuedRef.current) {
          processingQueuedRef.current = false;
          console.log("[DEBUG-useImageProcessingCore] Scheduling queued processing");
          processingTimeoutRef.current = window.setTimeout(() => {
            processImage();
            processingTimeoutRef.current = null;
          }, 1500);
        }
      }
    });
  }, [originalImage, scheduleProcessing, autoAnalyze, faceDetection, isFaceApiLoaded]);

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    debouncedProcess,
    processingQueued: processingQueuedRef.current,
    setProcessingQueued: (queued: boolean) => { processingQueuedRef.current = queued; },
    worker: workerRef.current,
    isWorkerReady
  };
};
