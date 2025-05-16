
import { useCallback } from 'react';
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
      
      // Call the processing complete callback if provided
      // But wrap it in setTimeout to avoid triggering immediate reprocessing
      if (onProcessingComplete) {
        setTimeout(() => {
          onProcessingComplete();
        }, 500);
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
