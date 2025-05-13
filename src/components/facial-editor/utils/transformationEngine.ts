import { FaceEffectOptions } from './transformationTypes';
import { processImageInChunks } from './transformation/chunkedProcessor';
import { adjustSliderValues, hasTransformations, hasEffects } from './transformation/sliderAdjuster';
import { applyFaceEffect } from './faceEffects';
import { mirrorFace } from '../hooks/useImageProcessing';

interface TransformEngineProps {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  width: number;
  height: number;
  faceDetection: any;
  sliderValues: Record<string, number>;
  faceEffectOptions?: FaceEffectOptions;
  worker?: Worker;
}

export const applyFeatureTransformations = async ({
  ctx,
  originalImage,
  width,
  height,
  faceDetection,
  sliderValues,
  faceEffectOptions,
  worker
}: TransformEngineProps): Promise<void> => {
  // Apply face mirroring first if enabled
  if (sliderValues.mirrorFace && sliderValues.mirrorFace > 0) {
    const mirrorSide = sliderValues.mirrorSide || 0; // 0 = left to right, 1 = right to left
    // Draw the original image first (important!)
    ctx.drawImage(originalImage, 0, 0);
    // Then apply mirroring
    mirrorFace(ctx, width, height, mirrorSide === 1);
    // Return early if no other transformations are needed
    if (!hasTransformations(sliderValues) && !hasEffects(faceEffectOptions)) {
      return;
    }
  }
  
  // If mirroring is the only transformation, we're already done
  if (sliderValues.mirrorFace && sliderValues.mirrorFace > 0 && 
      !hasTransformations(sliderValues) && !hasEffects(faceEffectOptions)) {
    return;
  }
  
  // Otherwise, continue with normal transformations
  const startTime = performance.now();

  try {
    // Adjust slider values for processing
    const adjustedSliderValues = adjustSliderValues(sliderValues);
    
    // For small images, process directly
    if (width * height < 500000) {
      console.log('Processing small image directly');
      if (worker) {
        // Process using Web Worker
        await processImageInChunks({
          ctx,
          originalImage,
          width,
          height,
          faceDetection,
          sliderValues: adjustedSliderValues,
          worker
        });
      } else {
        // Fallback to direct processing
        await processImageInChunks({
          ctx,
          originalImage,
          width,
          height,
          faceDetection,
          sliderValues: adjustedSliderValues
        });
      }
    } else {
      // Process large images in chunks
      console.log('Processing large image in chunks');
      await processImageInChunks({
        ctx, 
        originalImage,
        width,
        height,
        faceDetection,
        sliderValues: adjustedSliderValues,
        worker
      });
    }

    // Apply any additional face effects
    if (faceEffectOptions && faceEffectOptions.effectType !== 'none') {
      applyFaceEffect({
        ctx,
        width,
        height,
        faceDetection,
        effectType: faceEffectOptions.effectType,
        effectIntensity: faceEffectOptions.effectIntensity,
        maskImage: faceEffectOptions.maskImage,
        maskPosition: faceEffectOptions.maskPosition,
        maskScale: faceEffectOptions.maskScale
      });
    }

    console.log(`Image transformations completed in ${Math.round(performance.now() - startTime)}ms`);
  } catch (error) {
    console.error('Error in transformation engine:', error);
    // Fallback: just show the original image if transformations fail
    ctx.drawImage(originalImage, 0, 0);
  }
};
