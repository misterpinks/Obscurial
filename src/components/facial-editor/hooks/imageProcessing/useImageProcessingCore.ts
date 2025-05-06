
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

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
  const [processingQueued, setProcessingQueued] = useState(false);
  
  // Wrapper for process image that handles state updates
  const processImage = useCallback(() => {
    if (!originalImage) return;
    
    // Prevent reprocessing if already processing
    if (isProcessing) {
      console.log("Already processing, queueing another update");
      setProcessingQueued(true);
      return;
    }
    
    setIsProcessing(true);
    console.log("Starting image processing");
    
    try {
      // Process the image using our implementation
      const cleanCanvas = processImageImpl();
      
      // Update clean processed image URL for download
      if (cleanCanvas) {
        try {
          setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
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
      
      // Check if another processing was queued while we were processing
      if (processingQueued) {
        console.log("Processing was queued, executing next process");
        setProcessingQueued(false);
        // Use a minimal timeout to give the UI a chance to update
        setTimeout(processImage, 0);
      }
    }
  }, [
    originalImage,
    isProcessing,
    processImageImpl,
    faceDetection,
    isFaceApiLoaded,
    autoAnalyze,
    analyzeModifiedImage,
    processingQueued
  ]);

  // Super-short debounce time for responsiveness
  const debouncedProcess = useCallback(
    debounce(() => {
      if (processingQueued) {
        processImage();
        setProcessingQueued(false);
      }
    }, 0), // No debounce time for immediate response
    [processingQueued, processImage]
  );

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    processingQueued,
    setProcessingQueued,
    debouncedProcess
  };
};
