
import { useState, useEffect, RefObject, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { useLandmarksDrawing } from './imageProcessing/useLandmarks';
import { useCanvasProcessing } from './imageProcessing/useCanvasProcessing';
import { useImageDownload } from './imageProcessing/useImageDownload';

interface UseImageProcessingProps {
  originalImage: HTMLImageElement | null;
  originalCanvasRef: RefObject<HTMLCanvasElement>;
  processedCanvasRef: RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: RefObject<HTMLCanvasElement>;
  faceDetection: any;
  sliderValues: Record<string, number>;
  initialProcessingDone: boolean;
  showLandmarks: boolean;
  isFaceApiLoaded: boolean;
  detectFaces: () => void;
  analyzeModifiedImage: () => void;
  autoAnalyze: boolean;
  lastProcessedValues: string;
  setLastProcessedValues: (values: string) => void;
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  };
}

export const useImageProcessing = ({
  originalImage,
  originalCanvasRef,
  processedCanvasRef,
  cleanProcessedCanvasRef,
  faceDetection,
  sliderValues,
  initialProcessingDone,
  showLandmarks,
  isFaceApiLoaded,
  detectFaces,
  analyzeModifiedImage,
  autoAnalyze,
  lastProcessedValues,
  setLastProcessedValues,
  faceEffectOptions
}: UseImageProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>("");
  const [processingQueued, setProcessingQueued] = useState(false);

  // Use extracted landmark drawing functionality
  const { drawFaceLandmarks } = useLandmarksDrawing({
    faceDetection,
    processedCanvasRef,
    originalImage
  });

  // Use extracted canvas processing functionality
  const { processImage: processImageImpl } = useCanvasProcessing({
    originalImage,
    processedCanvasRef,
    cleanProcessedCanvasRef,
    faceDetection,
    sliderValues,
    showLandmarks,
    drawFaceLandmarks,
    faceEffectOptions
  });

  // Use extracted image download functionality
  const { downloadImage } = useImageDownload({
    cleanProcessedImageURL
  });

  // Wrapper for process image that handles state updates
  const processImage = useCallback(() => {
    if (!originalImage || !cleanProcessedCanvasRef.current) return;
    
    setIsProcessing(true);
    
    // Process the image using our implementation
    const cleanCanvas = processImageImpl();
    
    // Update clean processed image URL for download
    // Use a timeout to allow the UI to update before generating the data URL
    if (cleanCanvas) {
      setTimeout(() => {
        setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
      }, 0);
    }
    
    setIsProcessing(false);
    
    // If we have face data, analyze the modified image
    if (faceDetection && isFaceApiLoaded && autoAnalyze) {
      setTimeout(analyzeModifiedImage, 300);
    }
  }, [
    originalImage,
    cleanProcessedCanvasRef, 
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
    }, 150),
    [processingQueued, processImage]
  );

  // Process the image whenever slider values change or when face detection completes
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Check if values actually changed or if face effects changed
      const currentValuesString = JSON.stringify({
        sliders: sliderValues,
        effects: faceEffectOptions
      });
      
      if (currentValuesString !== lastProcessedValues) {
        // Queue processing instead of doing it immediately
        setProcessingQueued(true);
        setLastProcessedValues(currentValuesString);
      }
    }
  }, [sliderValues, originalImage, initialProcessingDone, lastProcessedValues, faceEffectOptions, setLastProcessedValues]);

  // Run the debounced processing when needed
  useEffect(() => {
    if (processingQueued) {
      debouncedProcess();
    }
  }, [processingQueued, debouncedProcess]);

  // Display the original image immediately after loading
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
      }
      
      // After displaying original image, proceed with initial processing
      if (isFaceApiLoaded) {
        detectFaces();
      }
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, detectFaces]);

  // Add a new effect to process the image after face detection completes
  useEffect(() => {
    if (originalImage && faceDetection && initialProcessingDone) {
      // Process image immediately after face detection is done
      processImage();
    }
  }, [faceDetection, initialProcessingDone, originalImage, processImage]);

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    downloadImage
  };
};
