
import { useEffect, RefObject, useCallback, useRef } from 'react';
import { throttle, debounce } from 'lodash';

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
  const processingTimerRef = useRef<number | null>(null);
  const processingRequestIdRef = useRef<number | null>(null);
  
  // Cleanup function for unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (processingTimerRef.current !== null) {
        clearTimeout(processingTimerRef.current);
      }
      if (processingRequestIdRef.current !== null) {
        cancelAnimationFrame(processingRequestIdRef.current);
      }
    };
  }, []);

  // More aggressive throttling with better frame timing
  const throttledProcess = useCallback(
    throttle(() => {
      if (isMounted.current) {
        // Cancel any existing processing
        if (processingTimerRef.current !== null) {
          clearTimeout(processingTimerRef.current);
        }
        if (processingRequestIdRef.current !== null) {
          cancelAnimationFrame(processingRequestIdRef.current);
        }
        
        // Use requestAnimationFrame for better frame timing
        processingRequestIdRef.current = requestAnimationFrame(() => {
          // Use a short timeout to batch rapid changes
          processingTimerRef.current = window.setTimeout(() => {
            processImage();
            processingTimerRef.current = null;
            processingRequestIdRef.current = null;
          }, 100);
        });
      }
    }, 300), // Increased throttle time for better performance
    [processImage]
  );
  
  // Improved debounced processor for slider interactions
  const debouncedProcessing = useCallback(
    debounce(() => {
      if (isMounted.current) {
        processImage();
      }
    }, 200),
    [processImage]
  );

  // Process the image whenever slider values change - with optimizations
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Check if values actually changed
      const currentValuesString = JSON.stringify({
        sliders: sliderValues,
        effects: faceEffectOptions
      });
      
      // Prevent unnecessary processing if values haven't changed
      if (currentValuesString !== lastProcessedValues) {
        // Use throttled processing for smoother UI
        throttledProcess();
        
        // Update last processed values to prevent reprocessing
        setLastProcessedValues(currentValuesString);
      }
    }
  }, [sliderValues, faceEffectOptions, originalImage, initialProcessingDone, lastProcessedValues, throttledProcess, setLastProcessedValues]);

  // Display the original image on canvas after loading - optimized
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      // Use requestAnimationFrame for smoother rendering
      requestAnimationFrame(() => {
        const origCtx = originalCanvasRef.current?.getContext("2d");
        if (origCtx) {
          // Set canvas dimensions to match image
          originalCanvasRef.current!.width = originalImage.width;
          originalCanvasRef.current!.height = originalImage.height;
          
          // Clear any previous content
          origCtx.clearRect(0, 0, originalCanvasRef.current!.width, originalCanvasRef.current!.height);
          
          // Draw the image to canvas with better performance
          origCtx.imageSmoothingQuality = 'medium'; // Balance between quality and speed
          origCtx.drawImage(originalImage, 0, 0);
          
          // After displaying original image, detect faces if needed but with a slight delay
          if (isFaceApiLoaded && !initialProcessingDone) {
            // Use timeout to ensure UI remains responsive
            setTimeout(detectFaces, 20);
          }
        }
      });
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, detectFaces, initialProcessingDone]);

  // Process image after face detection completes - with performance optimization
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Clear existing animation frame and timer
      if (processingRequestIdRef.current !== null) {
        cancelAnimationFrame(processingRequestIdRef.current);
      }
      if (processingTimerRef.current !== null) {
        clearTimeout(processingTimerRef.current);
      }
      
      // Use requestAnimationFrame for better frame timing
      processingRequestIdRef.current = requestAnimationFrame(() => {
        // Use a short timeout to allow UI to render
        processingTimerRef.current = window.setTimeout(() => {
          if (isMounted.current) {
            processImage();
            
            // Save current state to prevent reprocessing the same values
            const currentValuesString = JSON.stringify({
              sliders: sliderValues,
              effects: faceEffectOptions
            });
            setLastProcessedValues(currentValuesString);
          }
          processingTimerRef.current = null;
          processingRequestIdRef.current = null;
        }, 50);
      });
    }
  }, [faceDetection, initialProcessingDone, originalImage, processImage, setLastProcessedValues, sliderValues, faceEffectOptions]);
  
  return {
    throttledProcess,
    debouncedProcessing
  };
};
