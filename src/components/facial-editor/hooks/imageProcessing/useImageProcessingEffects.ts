
import { useEffect, RefObject } from 'react';

interface UseImageProcessingEffectsProps {
  originalImage: HTMLImageElement | null;
  originalCanvasRef: RefObject<HTMLCanvasElement>;
  initialProcessingDone: boolean;
  sliderValues: Record<string, number>;
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  };
  lastProcessedValues: string;
  setProcessingQueued: (queued: boolean) => void;
  setLastProcessedValues: (values: string) => void;
  detectFaces: () => void;
  processImage: () => void;
  debouncedProcess: () => void;
  processingQueued: boolean;
  isFaceApiLoaded: boolean;
  faceDetection: any;
}

export const useImageProcessingEffects = ({
  originalImage,
  originalCanvasRef,
  initialProcessingDone,
  sliderValues,
  faceEffectOptions,
  lastProcessedValues,
  setProcessingQueued,
  setLastProcessedValues,
  detectFaces,
  processImage,
  debouncedProcess,
  processingQueued,
  isFaceApiLoaded,
  faceDetection
}: UseImageProcessingEffectsProps) => {
  // Process the image whenever slider values change or when face effects change
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Check if values actually changed or if face effects changed
      const currentValuesString = JSON.stringify({
        sliders: sliderValues,
        effects: faceEffectOptions
      });
      
      if (currentValuesString !== lastProcessedValues) {
        console.log("Values changed, processing immediately");
        // Process directly instead of queuing
        processImage();
        setLastProcessedValues(currentValuesString);
      }
    }
  }, [sliderValues, faceEffectOptions, originalImage, initialProcessingDone, lastProcessedValues, processImage, setLastProcessedValues]);

  // Display the original image immediately after loading
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        console.log("Drawing original image to canvas");
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Clear any previous content
        origCtx.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height);
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
      }
      
      // After displaying original image, proceed with initial processing
      if (isFaceApiLoaded && !initialProcessingDone) {
        console.log("Detecting faces after image loaded");
        detectFaces();
      }
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, detectFaces, initialProcessingDone]);

  // Process image once after face detection completes
  useEffect(() => {
    if (originalImage && faceDetection && initialProcessingDone) {
      console.log("Processing image after face detection");
      processImage();
      
      // Save current state to prevent reprocessing
      const currentValuesString = JSON.stringify({
        sliders: sliderValues,
        effects: faceEffectOptions
      });
      setLastProcessedValues(currentValuesString);
    }
  }, [faceDetection, initialProcessingDone, originalImage, processImage, setLastProcessedValues, sliderValues, faceEffectOptions]);
  
  // Force process image when initially loaded - ALWAYS process at least once
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      console.log("Initial processing - forcing image display");
      processImage();
    }
  }, [initialProcessingDone, originalImage, processImage]);
  
  // Immediately process image after loading, even if there's no face detected
  useEffect(() => {
    if (originalImage && initialProcessingDone && !faceDetection) {
      console.log("Initial processing - no face detected but still showing image");
      processImage();
    }
  }, [initialProcessingDone, originalImage, faceDetection, processImage]);
};
