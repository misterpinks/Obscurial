
/**
 * Utility functions for applying special effects to faces
 * like blurring and masks
 * Optimized for better performance
 */

import type { TransformationParams } from './transformationTypes';

/**
 * Apply gaussian blur to a specific region
 */
export const applyBlur = (
  ctx: CanvasRenderingContext2D,
  x: number, 
  y: number, 
  width: number, 
  height: number,
  blurAmount: number
) => {
  if (blurAmount <= 0) return;
  
  // Increase blur intensity by multiplying by 3x
  const enhancedBlurAmount = blurAmount * 3;
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Apply the blur filter with enhanced amount
    ctx.filter = `blur(${enhancedBlurAmount}px)`;
    
    // Create a temporary canvas to hold the blurred region
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!tempCtx) return;
    
    // Copy the region to blur to the temporary canvas
    tempCtx.drawImage(
      ctx.canvas, 
      x, y, width, height,
      0, 0, width, height
    );
    
    // Draw the blurred version back to the original canvas
    ctx.drawImage(tempCanvas, x, y);
  } finally {
    // Reset the filter and restore canvas state
    ctx.filter = 'none';
    ctx.restore();
  }
};

/**
 * Apply a mask image to a face region with position and scale
 */
export const applyFaceMask = (
  ctx: CanvasRenderingContext2D,
  maskImage: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  position: { x: number, y: number } = { x: 0, y: 0 },
  scale: number = 1,
  opacity: number = 0.9
) => {
  // Save current canvas state
  ctx.save();
  
  try {
    // Set global alpha for the mask
    ctx.globalAlpha = opacity;
    
    // Calculate the adjusted position and size based on position and scale
    const adjustedX = x + (position.x * width);
    const adjustedY = y + (position.y * height);
    const adjustedWidth = width * scale;
    const adjustedHeight = height * scale;
    
    // Draw the mask image with position and scale adjustments
    ctx.drawImage(maskImage, adjustedX, adjustedY, adjustedWidth, adjustedHeight);
  } finally {
    // Restore canvas state
    ctx.restore();
  }
};

/**
 * Apply pixelation effect to a region with optimized performance
 * Completely rewritten to ensure proper pixelation
 */
export const applyPixelation = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelSize: number
) => {
  if (pixelSize <= 1) return;
  
  // Make pixel size more significant and ensure it's an integer
  const effectivePixelSize = Math.max(2, Math.round(pixelSize * 1.5));
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Get the image data from the region
    const imageData = ctx.getImageData(x, y, width, height);
    
    // Apply pixelation directly to the image data
    for (let blockY = 0; blockY < height; blockY += effectivePixelSize) {
      for (let blockX = 0; blockX < width; blockX += effectivePixelSize) {
        // Get color from the top-left pixel of each block
        const blockWidthLimit = Math.min(effectivePixelSize, width - blockX);
        const blockHeightLimit = Math.min(effectivePixelSize, height - blockY);
        
        // Sample from the middle of each block for better appearance
        const sampleX = blockX + Math.floor(blockWidthLimit / 2);
        const sampleY = blockY + Math.floor(blockHeightLimit / 2);
        
        // Get the pixel index
        const sampleIndex = (sampleY * width + sampleX) * 4;
        
        // Get color components
        const r = imageData.data[sampleIndex];
        const g = imageData.data[sampleIndex + 1];
        const b = imageData.data[sampleIndex + 2];
        const a = imageData.data[sampleIndex + 3];
        
        // Apply the color to all pixels in the block
        for (let y = 0; y < blockHeightLimit; y++) {
          for (let x = 0; x < blockWidthLimit; x++) {
            const index = ((blockY + y) * width + (blockX + x)) * 4;
            imageData.data[index] = r;
            imageData.data[index + 1] = g;
            imageData.data[index + 2] = b;
            imageData.data[index + 3] = a;
          }
        }
      }
    }
    
    // Put the modified image data back on the canvas
    ctx.putImageData(imageData, x, y);
  } finally {
    // Restore the canvas state
    ctx.restore();
  }
};

/**
 * Apply selected face effect based on provided parameters
 */
export const applyFaceEffect = ({
  ctx,
  originalImage,
  faceDetection,
  effectType,
  effectIntensity,
  maskImage,
  maskPosition = { x: 0, y: 0 },
  maskScale = 1
}: {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  faceDetection: any | null;
  effectType: 'blur' | 'pixelate' | 'mask' | 'none';
  effectIntensity: number;
  maskImage?: HTMLImageElement | null;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
}) => {
  if (!faceDetection || effectType === 'none' || effectIntensity <= 0) return;
  
  // Get face bounding box
  const box = faceDetection.detection.box;
  
  // Apply effect based on type
  switch (effectType) {
    case 'blur':
      applyBlur(ctx, box.x, box.y, box.width, box.height, effectIntensity * 0.5);
      break;
    case 'pixelate':
      applyPixelation(ctx, box.x, box.y, box.width, box.height, Math.max(2, Math.floor(effectIntensity * 0.4)));
      break;
    case 'mask':
      if (maskImage) {
        applyFaceMask(
          ctx, 
          maskImage, 
          box.x, 
          box.y, 
          box.width, 
          box.height,
          maskPosition,
          maskScale
        );
      }
      break;
    default:
      break;
  }
};
