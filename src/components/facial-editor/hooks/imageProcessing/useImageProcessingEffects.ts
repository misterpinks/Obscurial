
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
  // Use ref to track if the component is mounted
  const isMounted = useRef(true);
  const hasTriggeredInitialDetection = useRef(false);
  const hasDrawnImageToCanvas = useRef(false);
  const imageInstanceRef = useRef<HTMLImageElement | null>(null);
  
  // Cleanup function for unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Throttle processing for smoother UI during rapid changes
  const throttledProcess = useCallback(
    throttle(() => {
      if (isMounted.current) {
        processImage();
      }
    }, 100),
    [processImage]
  );

  // Process the image whenever slider values change
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Check if values actually changed
      const currentValuesString = JSON.stringify({
        sliders: sliderValues,
        effects: faceEffectOptions
      });
      
      // Prevent unnecessary processing if values haven't changed
      if (currentValuesString !== lastProcessedValues) {
        console.log("Slider values changed, processing image");
        
        // Use throttled processing for smoother UI
        throttledProcess();
        
        // Update last processed values
        setLastProcessedValues(currentValuesString);
      }
    }
  }, [sliderValues, faceEffectOptions, originalImage, initialProcessingDone, lastProcessedValues, throttledProcess, setLastProcessedValues]);

  // Reset flags when a new image is loaded (different image instance)
  useEffect(() => {
    if (originalImage && originalImage !== imageInstanceRef.current) {
      console.log("New image detected, resetting flags");
      hasTriggeredInitialDetection.current = false;
      hasDrawnImageToCanvas.current = false;
      imageInstanceRef.current = originalImage;
    }
  }, [originalImage]);

  // Display the original image on canvas after loading - ONLY ONCE PER IMAGE
  useEffect(() => {
    if (originalImage && originalCanvasRef.current && !hasDrawnImageToCanvas.current && originalImage === imageInstanceRef.current) {
      console.log("Drawing original image to canvas, dimensions:", originalImage.width, "x", originalImage.height);
      
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Clear any previous content
        origCtx.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height);
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
        
        // Mark that we've drawn this image to prevent redrawing
        hasDrawnImageToCanvas.current = true;
        console.log("Original image successfully drawn to canvas");
      }
    }
  }, [originalImage, originalCanvasRef]);

  // Trigger face detection ONLY ONCE per new image, and only after the image is drawn
  useEffect(() => {
    if (originalImage && 
        originalCanvasRef.current && 
        isFaceApiLoaded && 
        !initialProcessingDone && 
        !hasTriggeredInitialDetection.current &&
        hasDrawnImageToCanvas.current &&
        originalImage === imageInstanceRef.current) {
      
      console.log("Triggering face detection after drawing image to canvas");
      hasTriggeredInitialDetection.current = true;
      detectFaces();
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, initialProcessingDone, hasDrawnImageToCanvas.current, detectFaces]);

  // Process image after face detection completes - but prevent loops
  useEffect(() => {
    if (originalImage && 
        initialProcessingDone && 
        !processingQueued && 
        hasDrawnImageToCanvas.current &&
        originalImage === imageInstanceRef.current) {
      
      console.log("Processing image after face detection completed");
      
      // Use requestAnimationFrame for smooth UI
      window.requestAnimationFrame(() => {
        if (isMounted.current) {
          console.log("Processing image after detection completed");
          processImage();
          
          // Save current state to prevent reprocessing the same values
          const currentValuesString = JSON.stringify({
            sliders: sliderValues,
            effects: faceEffectOptions
          });
          setLastProcessedValues(currentValuesString);
        }
      });
    }
  }, [initialProcessingDone, originalImage]);
};
