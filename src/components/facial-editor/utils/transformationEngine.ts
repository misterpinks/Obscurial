
import { FaceEffectOptions } from './transformationTypes';
import { processImageInChunks } from './transformation/chunkedProcessor';
import { adjustSliderValues, hasTransformations, hasEffects } from './transformation/sliderAdjuster';
import { applyFaceEffect } from './faceEffects';

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

interface MirrorOptions {
  offsetX?: number; // -1 to 1 range for line position
  angle?: number; // -45 to 45 degrees
  cutoffY?: number; // 0 to 1 range (0 = top, 1 = bottom of image)
}

// Function to mirror face with advanced options
export function mirrorFace(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rightToLeft: boolean = false,
  options: MirrorOptions = {}
): void {
  // Create a temporary canvas to hold the original image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Copy the current content to the temporary canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);
  
  // Get options with defaults
  const offsetX = options.offsetX || 0; // -1 to 1 range
  const angle = options.angle || 0; // -45 to 45 degrees
  const cutoffY = options.cutoffY !== undefined ? options.cutoffY : 1; // 0 to 1 range
  
  // Calculate the center line for mirroring, adjusted by offsetX
  const centerX = width / 2 + (offsetX * width / 2);
  
  // Calculate the angle in radians
  const angleRad = angle * Math.PI / 180;
  
  // Calculate the cutoff point in pixels
  const cutoffYPx = height * cutoffY;
  
  // Draw the original image first
  ctx.drawImage(tempCanvas, 0, 0);
  
  // Save context state before transformations
  ctx.save();
  
  // Create a clipping path for the mirror area based on the angle
  ctx.beginPath();
  
  if (Math.abs(angle) < 0.1) {
    // For nearly vertical lines, use a simpler approach
    if (rightToLeft) {
      // Right to left: clip the left side for reflection
      ctx.rect(0, 0, centerX, cutoffYPx);
    } else {
      // Left to right: clip the right side for reflection
      ctx.rect(centerX, 0, width - centerX, cutoffYPx);
    }
  } else {
    // For angled lines, create a polygon for clipping
    const topY = 0;
    const bottomY = cutoffYPx;
    
    // Calculate x-offset at top and bottom of image based on angle
    const topOffset = Math.tan(angleRad) * topY;
    const bottomOffset = Math.tan(angleRad) * bottomY;
    
    if (rightToLeft) {
      // Right to left: Draw a polygon covering left side
      ctx.moveTo(0, topY);
      ctx.lineTo(centerX + topOffset, topY);
      ctx.lineTo(centerX + bottomOffset, bottomY);
      ctx.lineTo(0, bottomY);
    } else {
      // Left to right: Draw a polygon covering right side
      ctx.moveTo(centerX + topOffset, topY);
      ctx.lineTo(width, topY);
      ctx.lineTo(width, bottomY);
      ctx.lineTo(centerX + bottomOffset, bottomY);
    }
  }
  
  ctx.closePath();
  ctx.clip();
  
  // Mirror the appropriate half of the face with rotation
  if (rightToLeft) {
    // Right to left: Copy right side to left side with rotation
    ctx.translate(centerX, 0);
    ctx.scale(-1, 1);
    ctx.rotate(-angleRad); // Apply opposite angle to counteract the slant
    ctx.drawImage(tempCanvas, centerX, 0, width - centerX, height, 0, 0, width - centerX, height);
  } else {
    // Left to right: Copy left side to right side with rotation
    ctx.translate(centerX, 0);
    ctx.scale(-1, 1);
    ctx.rotate(-angleRad); // Apply opposite angle to counteract the slant
    ctx.drawImage(tempCanvas, 0, 0, centerX, height, 0, 0, centerX, height);
  }
  
  // Restore the context state
  ctx.restore();
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
    // Draw the original image first (important!)
    ctx.drawImage(originalImage, 0, 0);
    
    // Then apply mirroring with advanced options
    const mirrorSide = sliderValues.mirrorSide || 0; // 0 = left to right, 1 = right to left
    const mirrorOffsetX = sliderValues.mirrorOffsetX || 0;
    const mirrorAngle = sliderValues.mirrorAngle || 0;
    const mirrorCutoffY = sliderValues.mirrorCutoffY !== undefined ? sliderValues.mirrorCutoffY : 1;
    
    mirrorFace(ctx, width, height, mirrorSide === 1, {
      offsetX: mirrorOffsetX,
      angle: mirrorAngle,
      cutoffY: mirrorCutoffY
    });
    
    // Return early if no other transformations are needed
    if (!hasTransformations(sliderValues) && !hasEffects(faceEffectOptions)) {
      return;
    }
  } else {
    // If no mirroring, draw the original image
    ctx.drawImage(originalImage, 0, 0);
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
    
    // Extract necessary data for image processing
    const originalData = ctx.getImageData(0, 0, width, height);
    const outputData = ctx.createImageData(width, height);
    
    // Calculate face center and dimensions
    let centerX = width / 2;
    let centerY = height / 2;
    let faceWidth = width * 0.6;
    let faceHeight = height * 0.7;
    
    // Use detected face box if available
    if (faceDetection && faceDetection.detection) {
      const box = faceDetection.detection.box;
      centerX = box.x + box.width / 2;
      centerY = box.y + box.height / 2;
      faceWidth = box.width * 1.25;
      faceHeight = box.height * 1.25;
    }
    
    // Amplification factor for transformations
    const amplificationFactor = 3.5;
    
    // For small images, process directly
    if (width * height < 500000) {
      console.log('Processing small image directly');
      if (worker) {
        await processImageInChunks(
          ctx,
          originalData,
          outputData,
          width,
          height,
          centerX,
          centerY,
          faceWidth,
          faceHeight,
          adjustedSliderValues,
          amplificationFactor,
          originalImage,
          faceDetection,
          faceEffectOptions,
          worker
        );
      } else {
        await processImageInChunks(
          ctx,
          originalData,
          outputData,
          width,
          height,
          centerX,
          centerY,
          faceWidth,
          faceHeight,
          adjustedSliderValues,
          amplificationFactor,
          originalImage,
          faceDetection,
          faceEffectOptions
        );
      }
    } else {
      // Process large images in chunks
      console.log('Processing large image in chunks');
      await processImageInChunks(
        ctx,
        originalData,
        outputData,
        width,
        height,
        centerX,
        centerY,
        faceWidth,
        faceHeight,
        adjustedSliderValues,
        amplificationFactor,
        originalImage,
        faceDetection,
        faceEffectOptions,
        worker
      );
    }

    console.log(`Image transformations completed in ${Math.round(performance.now() - startTime)}ms`);
  } catch (error) {
    console.error('Error in transformation engine:', error);
    // Fallback: just show the original image if transformations fail
    ctx.drawImage(originalImage, 0, 0);
  }
};
