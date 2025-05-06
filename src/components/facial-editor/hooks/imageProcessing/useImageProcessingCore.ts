
import { useState, useCallback, RefObject } from 'react';
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
    
    setIsProcessing(true);
    
    try {
      // Process the image using our implementation
      const cleanCanvas = processImageImpl();
      
      // Update clean processed image URL for download
      // Use a timeout to allow the UI to update before generating the data URL
      if (cleanCanvas) {
        setTimeout(() => {
          try {
            setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
          } catch (e) {
            console.error("Failed to generate data URL:", e);
          }
        }, 0);
      }
      
      // If we have face data, analyze the modified image
      if (faceDetection && isFaceApiLoaded && autoAnalyze) {
        setTimeout(analyzeModifiedImage, 300);
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    originalImage,
    processImageImpl,
    faceDetection,
    isFaceApiLoaded,
    autoAnalyze,
    analyzeModifiedImage
  ]);

  // Debounced process function to prevent too many renders
  const debouncedProcess = useCallback(
    debounce(() => {
      if (processingQueued) {
        processImage();
        setProcessingQueued(false);
      }
    }, 50), // Reduced debounce time for more responsive UI
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
