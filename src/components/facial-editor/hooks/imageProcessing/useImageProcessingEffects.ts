
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
        console.log("Values changed, queuing processing");
        // Queue processing instead of doing it immediately
        setProcessingQueued(true);
        setLastProcessedValues(currentValuesString);
      }
    }
  }, [sliderValues, originalImage, initialProcessingDone, lastProcessedValues, faceEffectOptions, setLastProcessedValues, setProcessingQueued]);

  // Run the processing when needed - with immediate execution
  useEffect(() => {
    if (processingQueued) {
      console.log("Processing queued, executing immediately");
      // Process immediately to improve responsiveness
      processImage(); // Direct call instead of debounced version
      setProcessingQueued(false);
    }
  }, [processingQueued, processImage, setProcessingQueued]);

  // Listen for custom slider change events (from randomize button)
  useEffect(() => {
    const handleSliderValueChange = () => {
      console.log("Custom slider change event received");
      if (originalImage && initialProcessingDone) {
        processImage();
      }
    };

    document.addEventListener('sliderValueChange', handleSliderValueChange);
    
    return () => {
      document.removeEventListener('sliderValueChange', handleSliderValueChange);
    };
  }, [originalImage, initialProcessingDone, processImage]);

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

  // Process image immediately after face detection completes
  useEffect(() => {
    if (originalImage && faceDetection && initialProcessingDone) {
      // Process image immediately after face detection is done
      processImage();
    }
  }, [faceDetection, initialProcessingDone, originalImage, processImage]);
};
