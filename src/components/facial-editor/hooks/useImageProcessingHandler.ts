
import { useCallback, useRef, useEffect } from 'react';
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
  const initializedRef = useRef<boolean>(false);
  const processingStateRef = useRef<string>('idle');

  // Store information about the last processing operation
  const lastProcessingInfoRef = useRef({
    originalHash: '',
    sliderValuesHash: ''
  });
  
  console.log("[DEBUG-useImageProcessingHandler] Initializing hook, autoAnalyze:", autoAnalyze);
  
  // Store callback function in ref to avoid dependency issues
  const onProcessingCompleteRef = useRef(onProcessingComplete);
  useEffect(() => {
    onProcessingCompleteRef.current = onProcessingComplete;
  }, [onProcessingComplete]);
  
  // Fixed processImageImpl function wrapped in a useCallback to prevent re-renders
  const processImageImpl = useCallback(() => {
    if (!cleanProcessedCanvasRef.current || !originalImage) return undefined;
    
    // Check for processing lockout - helps break any loops
    const now = Date.now();
    if (processingDisabledRef.current && now - processingLockoutTimeRef.current < 5000) {
      console.log("[DEBUG-useImageProcessingHandler] Processing locked out for cooldown");
      return undefined;
    }

    // Check if we're already processing
    if (processingStateRef.current === 'processing') {
      console.log("[DEBUG-useImageProcessingHandler] Already processing, skipping");
      return undefined;
    }
    
    // Reset lockout if it's been long enough
    if (processingDisabledRef.current && now - processingLockoutTimeRef.current >= 5000) {
      console.log("[DEBUG-useImageProcessingHandler] Lockout period ended, re-enabling processing");
      processingDisabledRef.current = false;
    }
    
    // Generate a hash of the original image and slider values to detect changes
    const imageHash = originalImage.src.substring(originalImage.src.length - 20);
    const sliderValuesHash = JSON.stringify(faceEffectOptions || {});
    
    // Skip processing if we've already processed this exact image with these exact settings
    if (
      lastProcessingInfoRef.current.originalHash === imageHash && 
      lastProcessingInfoRef.current.sliderValuesHash === sliderValuesHash
    ) {
      console.log("[DEBUG-useImageProcessingHandler] Skipping processing - same image and settings");
      return cleanProcessedCanvasRef.current;
    }
    
    // Update processing state
    processingStateRef.current = 'processing';
    console.log("[DEBUG-useImageProcessingHandler] Starting image transformation");
    
    // Update our tracking refs
    lastProcessingInfoRef.current = {
      originalHash: imageHash,
      sliderValuesHash: sliderValuesHash
    };
    
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
    if (onProcessingCompleteRef.current && !callbackScheduledRef.current) {
      const now = Date.now();
      
      // Only allow callbacks at most once every 10 seconds (increased from 5 seconds)
      if (now - lastCallbackTimeRef.current > 10000) {
        callbackCountRef.current = 0;
        lastCallbackTimeRef.current = now;
        callbackScheduledRef.current = true;
        
        console.log("[DEBUG-useImageProcessingHandler] Scheduling processing complete callback");
        
        // Use longer timeout to prevent immediate reprocessing
        setTimeout(() => {
          callbackScheduledRef.current = false;
          console.log("[DEBUG-useImageProcessingHandler] Invoking processing complete callback");
          // Reset processing state just before calling the callback
          processingStateRef.current = 'idle';
          if (onProcessingCompleteRef.current) {
            onProcessingCompleteRef.current();
          }
        }, 3000); // Increased from 2000ms
      } else {
        // Additional check to prevent too many callbacks
        callbackCountRef.current += 1;
        console.log("[DEBUG-useImageProcessingHandler] Callback attempted too soon, count:", callbackCountRef.current);
        
        // If we're getting too many callbacks, disable processing for a while
        if (callbackCountRef.current > 2) { // Reduced threshold from 3 to 2
          console.log("[DEBUG-useImageProcessingHandler] Too many processing callbacks, enabling lockout");
          processingDisabledRef.current = true;
          processingLockoutTimeRef.current = now;
          // We'll reset this counter after the lockout period
        }
        
        // Reset processing state
        processingStateRef.current = 'idle';
      }
    } else {
      // Reset processing state if not scheduling a callback
      processingStateRef.current = 'idle';
    }
    
    return cleanCanvas;
  }, [cleanProcessedCanvasRef, originalImage, faceDetection, faceEffectOptions]);
  
  // Avoid re-initialization
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    return () => {
      initializedRef.current = false;
      processingStateRef.current = 'idle';
    };
  }, []);
  
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
    processImageImpl,
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
