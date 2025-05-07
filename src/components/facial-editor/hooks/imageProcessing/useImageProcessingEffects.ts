
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

  // Display the original image on canvas after loading
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      console.log("Original image provided, rendering to canvas");
      
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        console.log("Drawing original image to canvas, dimensions:", originalImage.width, "x", originalImage.height);
        
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Clear any previous content
        origCtx.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height);
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
      }
      
      // After displaying original image, detect faces if needed
      if (isFaceApiLoaded && !initialProcessingDone) {
        console.log("Detecting faces after image loaded");
        detectFaces();
      }
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, detectFaces, initialProcessingDone]);

  // Process image after face detection completes
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      console.log("Processing image after face detection or initialProcessingDone changed");
      
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
  }, [faceDetection, initialProcessingDone, originalImage, processImage, setLastProcessedValues, sliderValues, faceEffectOptions]);
  
  // Force process image when initially loaded
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      console.log("Initial processing - forcing image display");
      
      window.requestAnimationFrame(() => {
        if (isMounted.current) {
          console.log("Force processing image on initial load");
          processImage();
        }
      });
    }
  }, [initialProcessingDone, originalImage, processImage]);

  // Ensure image is processed even if no face is detected
  useEffect(() => {
    if (originalImage && initialProcessingDone && !faceDetection) {
      console.log("No face detected but still processing image");
      
      window.requestAnimationFrame(() => {
        if (isMounted.current) {
          console.log("Processing image without face detection");
          processImage();
        }
      });
    }
  }, [originalImage, initialProcessingDone, faceDetection, processImage]);
};
