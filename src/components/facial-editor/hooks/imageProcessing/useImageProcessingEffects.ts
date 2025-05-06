
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
  }, [sliderValues, originalImage, initialProcessingDone, lastProcessedValues, faceEffectOptions, setLastProcessedValues, processImage]);

  // Display the original image immediately after loading
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        console.log("Drawing original image to canvas");
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

  // Process image immediately after face detection completes
  useEffect(() => {
    if (originalImage && faceDetection && initialProcessingDone) {
      console.log("Processing image after face detection");
      // Process image immediately after face detection is done
      processImage();
    }
  }, [faceDetection, initialProcessingDone, originalImage, processImage]);
};
