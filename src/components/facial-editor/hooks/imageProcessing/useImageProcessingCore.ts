
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
  
  // Initialize the web worker
  useEffect(() => {
    if (isWorkerSupported) {
      try {
        // Create worker from the worker file URL
        const workerUrl = new URL('../../utils/workers/imageProcessingWorker.ts', import.meta.url);
        const worker = createWorker(workerUrl.href);
        
        if (worker) {
          // Listen for the ready message
          const readyHandler = (event: MessageEvent) => {
            if (event.data?.status === 'ready') {
              console.log('Image processing worker ready');
              setIsWorkerReady(true);
            }
          };
          
          worker.addEventListener('message', readyHandler);
          workerRef.current = worker;
          
          return () => {
            worker.removeEventListener('message', readyHandler);
            terminateWorker(worker);
            workerRef.current = undefined;
          };
        }
      } catch (error) {
        console.error('Failed to initialize worker:', error);
      }
    } else {
      console.log('Web Workers not supported, using main thread processing');
    }
  }, []);
  
  // Use requestAnimationFrame for smoother UI updates
  const scheduleProcessing = useCallback((callback: () => void) => {
    return window.requestAnimationFrame(() => {
      try {
        callback();
      } catch (error) {
        console.error("Error in scheduled processing:", error);
      }
    });
  }, []);

  // Improved debounce with proper timing
  const debouncedProcess = useCallback(
    debounce(() => processImage(), 150), // Increased debounce time for better performance
    [/* dependencies will be added by the real debounce */]
  );
  
  // Wrapper for process image that handles state updates with performance improvements
  const processImage = useCallback(() => {
    if (!originalImage) {
      console.log("No original image to process");
      return;
    }
    
    // Clear any existing timeout to avoid processing buildup
    if (processingTimeoutRef.current !== null) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    // Don't allow overlapping processing operations
    if (isProcessing) {
      console.log("Already processing, queuing request");
      processingQueuedRef.current = true;
      return;
    }
    
    // Set processing state
    setIsProcessing(true);
    console.log("Starting image processing");
    
    // Use requestAnimationFrame to prevent UI blocking
    scheduleProcessing(() => {
      try {
        // Process the image using our implementation
        const cleanCanvas = processImageImpl();
        
        // Update clean processed image URL for download
        if (cleanCanvas) {
          try {
            setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
            console.log("Generated clean processed image URL");
          } catch (e) {
            console.error("Failed to generate data URL:", e);
          }
        }
        
        // If we have face data, analyze the modified image with a delay
        if (faceDetection && isFaceApiLoaded && autoAnalyze) {
          processingTimeoutRef.current = window.setTimeout(analyzeModifiedImage, 300);
        }
      } catch (error) {
        console.error("Error processing image:", error);
      } finally {
        setIsProcessing(false);
        
        // If there was another process requested while this one was running, run it now
        if (processingQueuedRef.current) {
          processingQueuedRef.current = false;
          processingTimeoutRef.current = window.setTimeout(processImage, 100);
        }
      }
    });
  }, [
    originalImage,
    processImageImpl,
    faceDetection,
    isFaceApiLoaded,
    autoAnalyze,
    analyzeModifiedImage,
    isProcessing,
    scheduleProcessing
  ]);

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
