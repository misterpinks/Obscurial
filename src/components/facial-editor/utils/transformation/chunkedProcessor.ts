
/**
 * Processes images in chunks to prevent UI freezing
 */

import { processRow } from './pixelProcessor';
import { applyFaceEffect } from '../faceEffects';
import type { TransformationParams } from '../transformationTypes';
import { getMaxInfluenceDistance } from '../facialRegions';

// Process the image in chunks
export const processImageInChunks = (
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
  faceEffectOptions?: TransformationParams['faceEffectOptions']
): void => {
  // Constants
  const chunkHeight = 50; // Process 50 rows at a time
  const safetyMargin = 5; // Pixels of safety margin
  const halfFaceWidth = faceWidth / 2;
  const halfFaceHeight = faceHeight / 2;
  const innerEdge = 0.8;
  const maxInfluenceDistance = getMaxInfluenceDistance();
  
  let currentRow = 0;
  
  function processChunk() {
    const endRow = Math.min(currentRow + chunkHeight, height);
    
    // Process each row in the chunk
    for (let y = currentRow; y < endRow; y++) {
      processRow(
        y,
        width,
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
    
    currentRow = endRow;
    
    // If there are more rows to process, schedule the next chunk
    if (currentRow < height) {
      // Use requestAnimationFrame to prevent UI freezing
      requestAnimationFrame(processChunk);
    } else {
      // All processing done, finalize the image
      ctx.putImageData(outputData, 0, 0);
      
      // Apply face effects if enabled
      if (faceEffectOptions && faceEffectOptions.effectType !== 'none' && faceEffectOptions.effectIntensity > 0) {
        applyFaceEffect({
          ctx,
          originalImage,
          faceDetection,
          ...faceEffectOptions
        });
      }
    }
  }
  
  // Start the first chunk
  processChunk();
};
