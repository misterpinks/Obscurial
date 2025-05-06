
import { useState, useCallback } from 'react';

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
    if (!originalImage) {
      console.log("No original image to process");
      return;
    }
    
    // Don't allow overlapping processing operations
    if (isProcessing) {
      console.log("Already processing, queuing request");
      setProcessingQueued(true);
      return;
    }
    
    // Set processing state
    setIsProcessing(true);
    console.log("Starting image processing");
    
    // Use requestAnimationFrame to prevent UI blocking
    requestAnimationFrame(() => {
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
        // If there was another process requested while this one was running, run it now
        if (processingQueued) {
          setProcessingQueued(false);
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
    processingQueued
  ]);

  // Reference the same function for consistency
  const debouncedProcess = processImage;

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    debouncedProcess,
    processingQueued,
    setProcessingQueued
  };
};
