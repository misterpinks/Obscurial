
import { useCallback, useRef } from 'react';
import { applyFeatureTransformations } from '../utils/transformationEngine';
import { useImageProcessingCore } from './imageProcessing/useImageProcessingCore';
import type { FaceDetection } from './types';

interface UseImageProcessingHandlerProps {
  originalImage: HTMLImageElement | null;
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>;
  initialProcessingDone: boolean;
  autoAnalyze: boolean;
  lastProcessedValues: string;
  setLastProcessedValues: (values: string) => void;
  analyzeModifiedImage: () => void;
  isFaceApiLoaded: boolean;
  faceDetection: FaceDetection | null;
  faceEffectOptions: any;
  onProcessingComplete?: () => void;
}

export function useImageProcessingHandler({
  originalImage,
  cleanProcessedCanvasRef,
  initialProcessingDone,
  autoAnalyze,
  lastProcessedValues,
  setLastProcessedValues,
  analyzeModifiedImage,
  isFaceApiLoaded,
  faceDetection,
  faceEffectOptions,
  onProcessingComplete
}: UseImageProcessingHandlerProps) {
  // Track when the last callback was triggered to prevent loops
  const lastCallbackTimeRef = useRef<number>(0);
  const callbackCountRef = useRef<number>(0);
  const callbackScheduledRef = useRef<boolean>(false);
  const processingDisabledRef = useRef<boolean>(false);
  const processingLockoutTimeRef = useRef<number>(0);
  
  console.log("[DEBUG-useImageProcessingHandler] Initializing hook, autoAnalyze:", autoAnalyze);
  
  // Implementation of the image processing with Web Worker support
  const {
    isProcessing: isProcessingCore,
    cleanProcessedImageURL: cleanProcessedImageURLCore,
    processImage: processImageCore,
    debouncedProcess,
    processingQueued,
    setProcessingQueued,
    worker,
    isWorkerReady
  } = useImageProcessingCore({
    originalImage,
    initialProcessingDone,
    autoAnalyze,
    lastProcessedValues,
    setLastProcessedValues,
    processImageImpl: () => {
      if (!cleanProcessedCanvasRef.current || !originalImage) return undefined;
      
      // Check for processing lockout - helps break any loops
      const now = Date.now();
      if (processingDisabledRef.current && now - processingLockoutTimeRef.current < 5000) {
        console.log("[DEBUG-useImageProcessingHandler] Processing locked out for cooldown");
        return undefined;
      }
      
      // Reset lockout if it's been long enough
      if (processingDisabledRef.current && now - processingLockoutTimeRef.current >= 5000) {
        console.log("[DEBUG-useImageProcessingHandler] Lockout period ended, re-enabling processing");
        processingDisabledRef.current = false;
      }
      
      console.log("[DEBUG-useImageProcessingHandler] Starting image transformation");
      const cleanCanvas = cleanProcessedCanvasRef.current;
      const cleanCtx = cleanCanvas.getContext('2d');
      if (!cleanCtx) return undefined;
      
      // Set canvas dimensions to match image
      cleanCanvas.width = originalImage.width;
      cleanCanvas.height = originalImage.height;
      
      // Performance optimization: Use higher quality image smoothing
      cleanCtx.imageSmoothingEnabled = true;
      cleanCtx.imageSmoothingQuality = 'high';
      
      // Apply feature transformations to the clean canvas
      applyFeatureTransformations({
        ctx: cleanCtx,
        originalImage,
        width: cleanCanvas.width,
        height: cleanCanvas.height,
        faceDetection,
        sliderValues: {},  // This will be populated in the consumer
        faceEffectOptions,
        worker: isWorkerReady ? worker : undefined
      });
      
      // Call the processing complete callback if provided - with strict rate limiting
      if (onProcessingComplete && !callbackScheduledRef.current) {
        const now = Date.now();
        
        // Only allow callbacks at most once every 5 seconds (increased from 3 seconds)
        if (now - lastCallbackTimeRef.current > 5000) {
          callbackCountRef.current = 0;
          lastCallbackTimeRef.current = now;
          callbackScheduledRef.current = true;
          
          console.log("[DEBUG-useImageProcessingHandler] Scheduling processing complete callback");
          
          // Use longer timeout to prevent immediate reprocessing
          setTimeout(() => {
            callbackScheduledRef.current = false;
            console.log("[DEBUG-useImageProcessingHandler] Invoking processing complete callback");
            onProcessingComplete();
          }, 2000); // Increased from 1500ms
        } else {
          // Additional check to prevent too many callbacks
          callbackCountRef.current += 1;
          console.log("[DEBUG-useImageProcessingHandler] Callback attempted too soon, count:", callbackCountRef.current);
          
          // If we're getting too many callbacks, disable processing for a while
          if (callbackCountRef.current > 3) { // Reduced threshold from 5 to 3
            console.log("[DEBUG-useImageProcessingHandler] Too many processing callbacks, enabling lockout");
            processingDisabledRef.current = true;
            processingLockoutTimeRef.current = now;
            // We'll reset this counter after the 5-second lockout period
          }
        }
      }
      
      return cleanCanvas;
    },
    analyzeModifiedImage,
    isFaceApiLoaded,
    faceDetection
  });

  // Process single image for batch processing
  const processSingleImage = useCallback(async (img: HTMLImageElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("[DEBUG-useImageProcessingHandler] Processing single batch image");
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw the image first
        ctx.drawImage(img, 0, 0);
        
        // Apply transformations (simplified for batch processing)
        applyFeatureTransformations({
          ctx,
          originalImage: img,
          width: canvas.width,
          height: canvas.height,
          faceDetection: null,
          sliderValues: {},  // This will be populated in the consumer
          faceEffectOptions,
          worker: isWorkerReady ? worker : undefined
        });
        
        // Return the data URL
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error("[DEBUG-useImageProcessingHandler] Error in batch processing:", error);
        reject(error);
      }
    });
  }, [faceEffectOptions, isWorkerReady, worker]);

  return {
    isProcessingCore,
    cleanProcessedImageURLCore,
    processImageCore,
    debouncedProcess,
    processingQueued, 
    setProcessingQueued,
    worker,
    isWorkerReady,
    processSingleImage
  };
}
