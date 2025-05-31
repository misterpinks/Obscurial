
import { useEffect, RefObject, useCallback, useRef } from 'react';
import { throttle } from 'lodash';

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
  // Use refs to track state and prevent loops
  const isMounted = useRef(true);
  const imageInstanceRef = useRef<HTMLImageElement | null>(null);
  const hasDrawnToCanvasRef = useRef<HTMLImageElement | null>(null);
  const hasTriggeredDetectionRef = useRef<HTMLImageElement | null>(null);
  const hasProcessedAfterDetectionRef = useRef<HTMLImageElement | null>(null);
  
  // Cleanup function for unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset all refs when a new image is loaded
  useEffect(() => {
    if (originalImage && originalImage !== imageInstanceRef.current) {
      console.log("New image detected, resetting all tracking refs");
      imageInstanceRef.current = originalImage;
      hasDrawnToCanvasRef.current = null;
      hasTriggeredDetectionRef.current = null;
      hasProcessedAfterDetectionRef.current = null;
    }
  }, [originalImage]);

  // Throttle processing for smoother UI during rapid changes
  const throttledProcess = useCallback(
    throttle(() => {
      if (isMounted.current) {
        processImage();
      }
    }, 100),
    [processImage]
  );

  // 1. Draw original image to canvas - ONLY ONCE per image
  useEffect(() => {
    if (originalImage && 
        originalCanvasRef.current && 
        hasDrawnToCanvasRef.current !== originalImage) {
      
      console.log("Drawing original image to canvas:", originalImage.width, "x", originalImage.height);
      
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Clear and draw the image
        origCtx.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height);
        origCtx.drawImage(originalImage, 0, 0);
        
        // Mark that we've drawn this image
        hasDrawnToCanvasRef.current = originalImage;
        console.log("Original image successfully drawn to canvas");
      }
    }
  }, [originalImage, originalCanvasRef]);

  // 2. Trigger face detection - ONLY ONCE per image, ONLY after drawing
  useEffect(() => {
    if (originalImage && 
        isFaceApiLoaded && 
        !initialProcessingDone && 
        hasDrawnToCanvasRef.current === originalImage &&
        hasTriggeredDetectionRef.current !== originalImage) {
      
      console.log("Triggering face detection for new image");
      hasTriggeredDetectionRef.current = originalImage;
      detectFaces();
    }
  }, [originalImage, isFaceApiLoaded, initialProcessingDone, hasDrawnToCanvasRef.current, detectFaces]);

  // 3. Process image after detection completes - ONLY ONCE per image
  useEffect(() => {
    if (originalImage && 
        initialProcessingDone && 
        hasDrawnToCanvasRef.current === originalImage &&
        hasProcessedAfterDetectionRef.current !== originalImage) {
      
      console.log("Processing image after face detection completed");
      hasProcessedAfterDetectionRef.current = originalImage;
      
      // Use requestAnimationFrame for smooth UI
      window.requestAnimationFrame(() => {
        if (isMounted.current) {
          processImage();
          
          // Save current state to prevent reprocessing
          const currentValuesString = JSON.stringify({
            sliders: sliderValues,
            effects: faceEffectOptions
          });
          setLastProcessedValues(currentValuesString);
        }
      });
    }
  }, [initialProcessingDone, originalImage, processImage, sliderValues, faceEffectOptions, setLastProcessedValues]);

  // 4. Process image when slider values change - but only if we have completed initial processing
  useEffect(() => {
    if (originalImage && 
        initialProcessingDone && 
        hasProcessedAfterDetectionRef.current === originalImage) {
      
      // Check if values actually changed
      const currentValuesString = JSON.stringify({
        sliders: sliderValues,
        effects: faceEffectOptions
      });
      
      if (currentValuesString !== lastProcessedValues) {
        console.log("Slider values changed, processing image");
        throttledProcess();
        setLastProcessedValues(currentValuesString);
      }
    }
  }, [sliderValues, faceEffectOptions, originalImage, initialProcessingDone, lastProcessedValues, throttledProcess, setLastProcessedValues]);
};
