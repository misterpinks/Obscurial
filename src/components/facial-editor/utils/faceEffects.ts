
/**
 * Utility functions for applying special effects to faces
 * like blurring and masks
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
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Apply the blur filter
    ctx.filter = `blur(${blurAmount}px)`;
    
    // Create a temporary canvas to hold the blurred region
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
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
 * Apply pixelation effect to a region
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
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Get the image data for the region
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    // Calculate the number of pixels in each dimension
    const pixelsX = Math.ceil(width / pixelSize);
    const pixelsY = Math.ceil(height / pixelSize);
    
    // Loop through each "large pixel"
    for (let i = 0; i < pixelsY; i++) {
      for (let j = 0; j < pixelsX; j++) {
        // Calculate the corner of the current "large pixel"
        const pixelX = j * pixelSize;
        const pixelY = i * pixelSize;
        
        // Sample the color from the center of the "large pixel"
        const sampleX = Math.min(pixelX + Math.floor(pixelSize / 2), width - 1);
        const sampleY = Math.min(pixelY + Math.floor(pixelSize / 2), height - 1);
        const sampleIndex = (sampleY * width + sampleX) * 4;
        
        const r = data[sampleIndex];
        const g = data[sampleIndex + 1];
        const b = data[sampleIndex + 2];
        
        // Fill the entire "large pixel" with the sampled color
        for (let y = 0; y < pixelSize && pixelY + y < height; y++) {
          for (let x = 0; x < pixelSize && pixelX + x < width; x++) {
            const index = ((pixelY + y) * width + (pixelX + x)) * 4;
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
          }
        }
      }
    }
    
    // Put the modified image data back
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
