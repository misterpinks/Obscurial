
/**
 * Core transformation engine for applying facial feature modifications
 * Optimized for better performance with modular architecture and Web Worker support
 */

import { TransformationParams } from './transformationTypes';
import { getAmplificationFactor } from './facialRegions';
import { applyFaceEffect } from './faceEffects';
import { adjustSliderValues, hasTransformations, hasEffects } from './transformation/sliderAdjuster';
import { processImageInChunks } from './transformation/chunkedProcessor';

// Enhanced function to apply transformations with improved edge handling and performance
export const applyFeatureTransformations = async ({
  ctx,
  originalImage,
  width,
  height,
  faceDetection,
  sliderValues,
  faceEffectOptions,
  worker
}: TransformationParams & { worker?: Worker }) => {
  if (!ctx || !originalImage) {
    console.error("Missing context or original image in transformation");
    return;
  }
  
  console.log("Starting transformation with options:", {
    width, 
    height, 
    hasFaceDetection: !!faceDetection,
    hasSliderValues: !!sliderValues,
    hasEffectOptions: !!faceEffectOptions,
    hasWorker: !!worker
  });
  
  // Quick check if any transformations or effects are actually needed
  const needsTransformations = hasTransformations(sliderValues);
  const needsEffects = hasEffects(faceEffectOptions);
  
  console.log("Needs transformations:", needsTransformations, "Needs effects:", needsEffects);
  
  if (!needsTransformations && !needsEffects) {
    // Just copy the original image if no transformations needed
    console.log("No transformations or effects needed, copying original");
    ctx.drawImage(originalImage, 0, 0);
    return;
  }
  
  // Skip expensive pixel-by-pixel operations if only effects are needed
  if (!needsTransformations && needsEffects && faceEffectOptions) {
    // Draw original image first
    console.log("Only applying face effects, skipping transformations");
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
  
  // For actual transformations, use off-screen canvas for processing
  console.log("Setting up off-screen canvas for transformations");
  const offCanvas = document.createElement("canvas");
  offCanvas.width = width;
  offCanvas.height = height;
  const offCtx = offCanvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!offCtx) {
    console.error("Failed to get off-screen canvas context");
    return;
  }
  
  // Draw original to off-screen canvas
  offCtx.drawImage(originalImage, 0, 0);
  
  // Get image data for processing
  const originalData = offCtx.getImageData(0, 0, width, height);
  
  // Create output image data
  const outputData = ctx.createImageData(width, height);
  
  // Approximate face center - use face detection if available, otherwise estimate
  let centerX = width / 2;
  let centerY = height / 2;
  let faceWidth = width * 0.8;
  let faceHeight = height * 0.9;
  
  // Use detected face box if available
  if (faceDetection && faceDetection.detection) {
    const box = faceDetection.detection.box;
    centerX = box.x + box.width / 2;
    centerY = box.y + box.height / 2;
    // Make face area larger than detected to avoid edge artifacts
    faceWidth = box.width * 1.5;
    faceHeight = box.height * 1.5;
    console.log("Using detected face box for transformation:", {centerX, centerY, faceWidth, faceHeight});
  }
  
  // Calculate dynamic amplification factor based on image dimensions
  const baseAmplificationFactor = getAmplificationFactor();
  
  // Normalize based on a standard size of 500x500
  const sizeFactor = Math.sqrt((width * height) / (500 * 500));
  
  // Combine base amplification with size factor
  const amplificationFactor = baseAmplificationFactor * sizeFactor * 1.5;
  console.log(`Using amplification factor: ${amplificationFactor} (base: ${baseAmplificationFactor}, size factor: ${sizeFactor})`);
  
  // Safety check for extreme values - automatically clamp them
  const clampedSliderValues = adjustSliderValues(sliderValues);
  
  // Use chunked processing with Web Worker support for better UI responsiveness
  console.log("Starting chunked image processing");
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
    clampedSliderValues,
    amplificationFactor,
    originalImage,
    faceDetection,
    faceEffectOptions,
    worker // Pass the worker if available
  );
  
  // After all transformations, apply any face effects if needed
  if (needsEffects && faceEffectOptions) {
    console.log("Applying face effects after transformations");
    applyFaceEffect({
      ctx,
      originalImage: null, // Don't need original image here as we're working on already transformed data
      faceDetection,
      ...faceEffectOptions
    });
  }
  
  console.log("Image transformation complete");
};
