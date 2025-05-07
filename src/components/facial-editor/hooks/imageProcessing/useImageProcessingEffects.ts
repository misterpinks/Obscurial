
import { useEffect, RefObject, useRef } from 'react';

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
  // Use a ref to track if we've already rendered this image
  const hasProcessedImage = useRef(false);
  // Use a ref to track if detectFaces has been called
  const faceDetectionCalled = useRef(false);
  // Use a debounce timer ref to prevent too many updates
  const processingTimerRef = useRef<number | null>(null);

  // Process the image whenever slider values change - optimized to reduce redundancy
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
        
        // Clear any existing processing timer
        if (processingTimerRef.current) {
          window.clearTimeout(processingTimerRef.current);
        }
        
        // Debounce the processing to reduce strain
        processingTimerRef.current = window.setTimeout(() => {
          // Use requestAnimationFrame for smooth UI updates
          requestAnimationFrame(() => {
            console.log("Processing image due to value change");
            processImage();
            setLastProcessedValues(currentValuesString);
            processingTimerRef.current = null;
          });
        }, 100);
      }
    }
    
    return () => {
      if (processingTimerRef.current) {
        window.clearTimeout(processingTimerRef.current);
      }
    };
  }, [sliderValues, faceEffectOptions, originalImage, initialProcessingDone, lastProcessedValues, processImage, setLastProcessedValues]);

  // Display the original image on canvas after loading
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      console.log("Original image provided, rendering to canvas");
      
      // Reset processing flags when a new image is loaded
      hasProcessedImage.current = false;
      faceDetectionCalled.current = false;
      
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        console.log("Drawing original image to canvas");
        
        // Clear previous content first
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        origCtx.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height);
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
      }
      
      // After displaying original image, detect faces if needed
      if (isFaceApiLoaded && !faceDetectionCalled.current) {
        console.log("Detecting faces after image loaded");
        faceDetectionCalled.current = true;
        // Give a small delay to ensure the UI is updated first
        setTimeout(() => {
          detectFaces();
        }, 50);
      }
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, detectFaces]);

  // Process image after face detection completes
  useEffect(() => {
    if (originalImage && initialProcessingDone && !hasProcessedImage.current) {
      console.log("Processing image after face detection or initialProcessingDone changed");
      
      hasProcessedImage.current = true;
      
      // Use requestAnimationFrame for smooth UI
      requestAnimationFrame(() => {
        console.log("Processing image after detection completed");
        processImage();
        
        // Save current state to prevent reprocessing the same values
        const currentValuesString = JSON.stringify({
          sliders: sliderValues,
          effects: faceEffectOptions
        });
        setLastProcessedValues(currentValuesString);
      });
    }
  }, [faceDetection, initialProcessingDone, originalImage, processImage, setLastProcessedValues, sliderValues, faceEffectOptions]);
};
