
import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { createWorker, processImageWithWorker, terminateWorker, isWorkerSupported } from '../../utils/workers/workerManager';
import { useWorkerSetup } from './useWorkerSetup';
import { useProcessingQueue } from './useProcessingQueue';

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
  const autoAnalyzeRequested = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const hasInitialized = useRef<boolean>(false);
  
  // Prevent console spam - only log once
  if (!hasInitialized.current) {
    console.log("[DEBUG-useImageProcessingCore] Initializing hook, autoAnalyze:", autoAnalyze);
    hasInitialized.current = true;
  }
  
  // Initialize worker with custom hook
  const { worker, isWorkerReady } = useWorkerSetup();
  
  // Use a separate hook for processing queue management
  const { 
    processingQueued,
    setProcessingQueued,
    scheduleProcessing,
    addToQueue,
    clearQueue
  } = useProcessingQueue();
  
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
  
  // Debounced process function - created once
  const debouncedProcess = useCallback(
    debounce(() => {
      console.log("[DEBUG-useImageProcessingCore] Debounced process triggered");
      processImage();
    }, 500),
    [] // Empty dependency array to create only once
  );
  
  // Stable processImage function
  const processImage = useCallback(() => {
    if (!originalImage) {
      console.log("[DEBUG-useImageProcessingCore] No original image to process");
      return;
    }
    
    // If processing is already in progress, queue it and return
    if (isProcessingRef.current) {
      console.log("[DEBUG-useImageProcessingCore] Already processing, queueing request");
      addToQueue();
      return;
    }
    
    // Set processing state
    setIsProcessing(true);
    isProcessingRef.current = true;
    
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
        if (faceDetection && isFaceApiLoaded && autoAnalyze && !processingQueued) {
          // Set flag to track that we've requested analysis
          autoAnalyzeRequested.current = true;
          
          setTimeout(() => {
            // Only proceed if we haven't canceled this timer
            if (autoAnalyzeRequested.current) {
              console.log("[DEBUG-useImageProcessingCore] Running delayed analysis after processing");
              analyzeModifiedImageRef.current();
            }
          }, 3000);
        }
      } catch (error) {
        console.error("[DEBUG-useImageProcessingCore] Error processing image:", error);
      } finally {
        setIsProcessing(false);
        
        // Delay resetting the processing flag to prevent rapid cycling
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log("[DEBUG-useImageProcessingCore] Processing complete, flag reset");
          
          // If there was another process requested while this one was running, run it now
          if (processingQueued) {
            clearQueue();
            console.log("[DEBUG-useImageProcessingCore] Processing queued request");
            // Use a delay before processing the next item
            setTimeout(processImage, 1000);
          }
        }, 500);
      }
    });
  }, [
    originalImage, 
    scheduleProcessing, 
    autoAnalyze, 
    faceDetection, 
    isFaceApiLoaded, 
    processingQueued, 
    addToQueue, 
    clearQueue
  ]);

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    debouncedProcess,
    processingQueued,
    setProcessingQueued,
    worker,
    isWorkerReady
  };
};
