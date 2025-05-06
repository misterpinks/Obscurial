
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
 * Fixed to ensure proper pixelation
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
  const effectivePixelSize = Math.max(2, Math.round(pixelSize * 2.5));
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Get the image data for the region to be pixelated
    const imageData = ctx.getImageData(x, y, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!tempCtx) return;
    
    // Draw the original image to the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Clear the original area
    ctx.clearRect(x, y, width, height);
    
    // Draw the pixelated version
    for (let blockY = 0; blockY < height; blockY += effectivePixelSize) {
      for (let blockX = 0; blockX < width; blockX += effectivePixelSize) {
        // Calculate block size (handling edge cases)
        const blockWidth = Math.min(effectivePixelSize, width - blockX);
        const blockHeight = Math.min(effectivePixelSize, height - blockY);
        
        if (blockWidth <= 0 || blockHeight <= 0) continue;
        
        // Get the average color of the block
        const blockData = tempCtx.getImageData(blockX, blockY, blockWidth, blockHeight);
        const rgba = getAverageColor(blockData.data);
        
        // Fill the block with the average color
        ctx.fillStyle = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a / 255})`;
        ctx.fillRect(x + blockX, y + blockY, blockWidth, blockHeight);
      }
    }
  } finally {
    // Restore the canvas state
    ctx.restore();
  }
};

/**
 * Helper function to get the average color from an array of pixel data
 */
function getAverageColor(data: Uint8ClampedArray) {
  let r = 0, g = 0, b = 0, a = 0, count = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    a += data[i + 3];
    count++;
  }
  
  if (count === 0) return { r: 0, g: 0, b: 0, a: 255 };
  
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
    a: Math.round(a / count)
  };
}

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
      // Increase the intensity impact for pixelation to make it more visible
      applyPixelation(ctx, box.x, box.y, box.width, box.height, Math.max(2, Math.floor(effectIntensity * 0.3)));
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
