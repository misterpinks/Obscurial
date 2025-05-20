
/**
 * Optimized image processing in chunks for better UI responsiveness
 */

import { applyFaceEffect } from '../faceEffects';
import { processRow } from './pixelProcessor';
import { processImageWithWorker, isWorkerSupported } from '../workers/workerManager';

// Process image in small chunks with a yield to UI thread
export const processImageInChunks = async (
  ctx: CanvasRenderingContext2D,
  originalData: ImageData,
  outputData: ImageData,
  width: number,
  height: number,
  centerX: number, 
  centerY: number,
  faceWidth: number,
  faceHeight: number,
  clampedSliderValues: Record<string, number>,
  amplificationFactor: number,
  originalImage: HTMLImageElement,
  faceDetection: any,
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  },
  worker?: Worker
) => {
  // Calculate influence boundaries
  const halfFaceWidth = faceWidth / 2;
  const halfFaceHeight = faceHeight / 2;
  
  // Transition zone configuration
  const innerEdge = 0.85;  // Inner edge of the transition zone (as a proportion of max influence distance)
  const maxInfluenceDistance = 1.1; // Maximum distance for transform influence
  
  // Safety margin for edge handling
  const safetyMargin = 3;

  try {
    // Check if we can use Web Worker processing
    if (worker && isWorkerSupported) {
      console.log("Using Web Worker for image processing");
      
      const workerParams = {
        centerX,
        centerY,
        halfFaceWidth,
        halfFaceHeight,
        innerEdge,
        maxInfluenceDistance,
        sliderValues: clampedSliderValues,
        amplificationFactor,
        safetyMargin
      };
      
      try {
        // Use the worker to process the image with simplified error handling
        const processedImageData = await processImageWithWorker(
          worker,
          originalData,
          workerParams
        );
        
        // Put the processed image data on the canvas
        ctx.putImageData(processedImageData, 0, 0);
        
        // Apply any face effects if needed
        if (faceEffectOptions && faceDetection) {
          applyFaceEffect({
            ctx,
            originalImage,
            faceDetection,
            ...faceEffectOptions
          });
        }
        
        return;
      } catch (error) {
        console.warn("Worker processing failed, falling back to main thread:", error);
        // Fall back to main thread processing if worker fails
      }
    }
    
    // If worker is not available or failed, use main thread processing
    console.log("Using main thread for image processing");
    
    // Create a new output ImageData if needed
    if (!outputData || outputData.width !== width || outputData.height !== height) {
      outputData = ctx.createImageData(width, height);
    }
    
    // Determine how many rows to process per chunk
    const rowsPerChunk = 20; // Process 20 rows at a time
    
    // Use requestAnimationFrame for better UI responsiveness
    const processChunk = (startY: number) => {
      // Process a chunk of rows
      const endY = Math.min(startY + rowsPerChunk, height);
      
      for (let y = startY; y < endY; y++) {
        processRow(
          y,
          width,
          height,
          originalData,
          outputData,
          centerX,
          centerY,
          halfFaceWidth,
          halfFaceHeight,
          innerEdge,
          maxInfluenceDistance,
          clampedSliderValues,
          amplificationFactor,
          safetyMargin
        );
      }
      
      // If there are more rows to process, schedule the next chunk
      if (endY < height) {
        requestAnimationFrame(() => processChunk(endY));
      } else {
        // All done, put the image data on the canvas
        ctx.putImageData(outputData, 0, 0);
        
        // Apply any face effects if needed
        if (faceEffectOptions && faceDetection) {
          applyFaceEffect({
            ctx,
            originalImage,
            faceDetection,
            ...faceEffectOptions
          });
        }
      }
    };
    
    // Start processing from the first row
    processChunk(0);
  } catch (error) {
    console.error("Error in image processing:", error);
    // Fallback to direct canvas rendering in case of error
    ctx.drawImage(originalImage, 0, 0);
  }
};
