
/**
 * Core transformation engine for applying facial feature modifications
 * Optimized for better performance with modular architecture
 */

import { TransformationParams } from './transformationTypes';
import { getAmplificationFactor } from './facialRegions';
import { applyFaceEffect } from './faceEffects';
import { adjustSliderValues, hasTransformations, hasEffects } from './transformation/sliderAdjuster';
import { processImageInChunks } from './transformation/chunkedProcessor';

// Enhanced function to apply transformations with improved memory handling
export const applyFeatureTransformations = ({
  ctx,
  originalImage,
  width,
  height,
  faceDetection,
  sliderValues,
  faceEffectOptions
}: TransformationParams) => {
  if (!ctx || !originalImage) return;
  
  // Check if image is too large - implement downsampling to prevent memory issues
  const MAX_DIMENSION = 2048; // Maximum safe dimension to process
  let useOriginalSize = true;
  let scaledWidth = width;
  let scaledHeight = height;
  
  // Scale down large images to prevent memory issues
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    console.log(`Image too large (${width}x${height}), downsampling for processing`);
    useOriginalSize = false;
    
    const scaleFactor = MAX_DIMENSION / Math.max(width, height);
    scaledWidth = Math.floor(width * scaleFactor);
    scaledHeight = Math.floor(height * scaleFactor);
    
    console.log(`Downsampled to ${scaledWidth}x${scaledHeight} for processing`);
  }
  
  // Quick check if any transformations or effects are actually needed
  const needsTransformations = hasTransformations(sliderValues);
  const needsEffects = hasEffects(faceEffectOptions);
  
  if (!needsTransformations && !needsEffects) {
    // Just copy the original image if no transformations needed
    ctx.drawImage(originalImage, 0, 0);
    return;
  }
  
  // Skip expensive pixel-by-pixel operations if only effects are needed
  if (!needsTransformations && needsEffects && faceEffectOptions) {
    // Draw original image first
    ctx.drawImage(originalImage, 0, 0);
    
    // Then apply face effects only
    applyFaceEffect({
      ctx,
      originalImage,
      faceDetection,
      ...faceEffectOptions
    });
    return;
  }
  
  try {
    // For actual transformations, use off-screen canvas for processing
    const offCanvas = document.createElement("canvas");
    offCanvas.width = scaledWidth;
    offCanvas.height = scaledHeight;
    const offCtx = offCanvas.getContext("2d", { alpha: false, willReadFrequently: true });
    if (!offCtx) return;
    
    // Draw original (possibly scaled down) to off-screen canvas
    if (useOriginalSize) {
      offCtx.drawImage(originalImage, 0, 0);
    } else {
      offCtx.drawImage(originalImage, 0, 0, scaledWidth, scaledHeight);
    }
    
    // Get image data for processing - this is the memory-intensive step
    const originalData = offCtx.getImageData(0, 0, scaledWidth, scaledHeight);
    
    // Create output image data
    const outputData = offCtx.createImageData(scaledWidth, scaledHeight);
    
    // Approximate face center - use face detection if available, otherwise estimate
    let centerX = scaledWidth / 2;
    let centerY = scaledHeight / 2;
    let faceWidth = scaledWidth * 0.8;
    let faceHeight = scaledHeight * 0.9;
    
    // Use detected face box if available
    if (faceDetection && faceDetection.detection) {
      const box = faceDetection.detection.box;
      
      // Scale face box if we're using a scaled down image
      if (!useOriginalSize) {
        const scaleFactor = scaledWidth / width;
        centerX = box.x * scaleFactor + (box.width * scaleFactor) / 2;
        centerY = box.y * scaleFactor + (box.height * scaleFactor) / 2;
        faceWidth = box.width * scaleFactor * 1.5;
        faceHeight = box.height * scaleFactor * 1.5;
      } else {
        centerX = box.x + box.width / 2;
        centerY = box.y + box.height / 2;
        faceWidth = box.width * 1.5;
        faceHeight = box.height * 1.5;
      }
    }
    
    // Calculate dynamic amplification factor based on image dimensions
    const baseAmplificationFactor = getAmplificationFactor();
    
    // Normalize based on a standard size of 500x500
    const sizeFactor = Math.sqrt((scaledWidth * scaledHeight) / (500 * 500));
    
    // Combine base amplification with size factor
    const amplificationFactor = baseAmplificationFactor * sizeFactor * 1.5;
    
    // Safety check for extreme values - automatically clamp them
    const clampedSliderValues = adjustSliderValues(sliderValues);
    
    // Process the image in chunks for better UI responsiveness and memory usage
    processImageInChunks(
      offCtx,
      originalData,
      outputData,
      scaledWidth,
      scaledHeight,
      centerX,
      centerY,
      faceWidth,
      faceHeight,
      clampedSliderValues,
      amplificationFactor,
      originalImage,
      faceDetection,
      faceEffectOptions
    );
    
    // Now draw the result back to the original context, possibly scaling back up
    if (useOriginalSize) {
      ctx.drawImage(offCanvas, 0, 0);
    } else {
      // Clear the destination canvas first
      ctx.clearRect(0, 0, width, height);
      // Draw the processed smaller image, stretched back to full size
      ctx.drawImage(offCanvas, 0, 0, width, height);
    }
    
    // Clean up memory
    offCanvas.width = 1;
    offCanvas.height = 1;
    
  } catch (error) {
    console.error("Error in transformation engine:", error);
    
    // Fallback - just draw the original image if processing failed
    ctx.drawImage(originalImage, 0, 0);
  }
};
