
import { useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

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

  // Throttled version for frequent updates (like slider dragging)
  const debouncedProcess = useCallback(
    debounce(() => processImage(), 50),
    [/* dependencies will be added by the real debounce */]
  );
  
  // Wrapper for process image that handles state updates
  const processImage = useCallback(() => {
    if (!originalImage) {
      console.log("No original image to process");
      return;
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
        
        // If we have face data, analyze the modified image
        if (faceDetection && isFaceApiLoaded && autoAnalyze) {
          setTimeout(analyzeModifiedImage, 0);
        }
      } catch (error) {
        console.error("Error processing image:", error);
      } finally {
        setIsProcessing(false);
        // If there was another process requested while this one was running, run it now
        if (processingQueuedRef.current) {
          processingQueuedRef.current = false;
          setTimeout(processImage, 0);
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
    setProcessingQueued: (queued: boolean) => { processingQueuedRef.current = queued; }
  };
};
