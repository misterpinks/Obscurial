
// Import any required dependencies here
import { FaceDetection } from '../hooks/types';

// Define interfaces for the parameters
interface TransformationParams {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  width: number;
  height: number;
  faceDetection: FaceDetection | null;
  sliderValues: Record<string, number>;
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  };
  worker?: Worker;
}

export const applyFeatureTransformations = ({
  ctx,
  originalImage,
  width,
  height,
  faceDetection,
  sliderValues = {},
  faceEffectOptions = { effectType: 'none', effectIntensity: 0 },
  worker
}: TransformationParams): void => {
  console.log("Applying feature transformations with simplified approach");
  
  // Set canvas dimensions to match image
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  
  // Always start by drawing the original image
  ctx.drawImage(originalImage, 0, 0);
  console.log("Original image drawn to canvas");

  // Check if we need to do any processing at all
  const needsProcessing = Object.keys(sliderValues).some(key => sliderValues[key] !== 0);
  
  // If no slider values are set and no effects are applied, just return with the original image
  if (!needsProcessing && faceEffectOptions.effectType === 'none') {
    console.log("No processing needed, displaying original image");
    return;
  }

  // Apply transformations directly in main thread for reliability
  console.log("Applying transformations in main thread");
  applyDirectTransformations(ctx, originalImage, sliderValues, width, height);
  
  // Apply face effects if needed
  if (faceEffectOptions.effectType !== 'none' && faceDetection && faceEffectOptions.effectIntensity > 0) {
    console.log("Applying face effects:", faceEffectOptions.effectType);
    applyBasicFaceEffect(ctx, faceDetection, faceEffectOptions);
  }
  
  console.log("Feature transformations completed");
};

// Apply transformations directly without worker dependency
function applyDirectTransformations(
  ctx: CanvasRenderingContext2D, 
  originalImage: HTMLImageElement,
  sliderValues: Record<string, number>,
  width: number,
  height: number
) {
  console.log("Applying direct transformations with values:", sliderValues);
  
  try {
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply basic color adjustments
    const brightness = (sliderValues.brightness || 0) * 2.55; // Convert percentage to 0-255 range
    const contrast = 1 + (sliderValues.contrast || 0) / 100;
    const saturation = 1 + (sliderValues.saturation || 0) / 100;
    
    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Apply brightness
      r += brightness;
      g += brightness;
      b += brightness;
      
      // Apply contrast
      r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrast + 0.5) * 255;
      
      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + saturation * (r - gray);
      g = gray + saturation * (g - gray);
      b = gray + saturation * (b - gray);
      
      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    // Put the processed image data back to canvas
    ctx.putImageData(imageData, 0, 0);
    console.log("Direct transformations applied successfully");
    
  } catch (error) {
    console.error("Error in direct transformations:", error);
    // Fallback to CSS filters if pixel manipulation fails
    applyFallbackFilters(ctx, originalImage, sliderValues);
  }
}

// Fallback using CSS filters
function applyFallbackFilters(
  ctx: CanvasRenderingContext2D, 
  originalImage: HTMLImageElement,
  sliderValues: Record<string, number>
) {
  console.log("Using CSS filter fallback");
  
  const brightness = 1 + (sliderValues.brightness || 0) / 100;
  const contrast = 1 + (sliderValues.contrast || 0) / 100;
  const saturation = 1 + (sliderValues.saturation || 0) / 100;
  const blur = Math.max(0, (sliderValues.blur || 0) / 10);
  
  // Apply filters using CSS filter
  ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`;
  
  // Clear and redraw with filters
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(originalImage, 0, 0);
  
  // Reset filter
  ctx.filter = 'none';
}

// Basic face effect application
function applyBasicFaceEffect(
  ctx: CanvasRenderingContext2D,
  faceDetection: any,
  faceEffectOptions: any
) {
  if (!faceDetection?.detection?.box) return;
  
  const box = faceDetection.detection.box;
  const { effectType, effectIntensity } = faceEffectOptions;
  
  try {
    switch (effectType) {
      case 'blur':
        ctx.filter = `blur(${effectIntensity * 0.5}px)`;
        ctx.drawImage(ctx.canvas, box.x, box.y, box.width, box.height, box.x, box.y, box.width, box.height);
        ctx.filter = 'none';
        break;
      case 'pixelate':
        // Simple pixelation effect
        const pixelSize = Math.max(2, Math.floor(effectIntensity * 0.3));
        const imageData = ctx.getImageData(box.x, box.y, box.width, box.height);
        const pixelatedData = pixelateImageData(imageData, pixelSize);
        ctx.putImageData(pixelatedData, box.x, box.y);
        break;
    }
  } catch (error) {
    console.error("Error applying face effect:", error);
  }
}

// Simple pixelation function
function pixelateImageData(imageData: ImageData, pixelSize: number): ImageData {
  const { data, width, height } = imageData;
  const pixelatedData = new ImageData(width, height);
  
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Get the color of the top-left pixel in this block
      const pixelIndex = (y * width + x) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];
      
      // Fill the entire block with this color
      for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
        for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
          const targetIndex = ((y + dy) * width + (x + dx)) * 4;
          pixelatedData.data[targetIndex] = r;
          pixelatedData.data[targetIndex + 1] = g;
          pixelatedData.data[targetIndex + 2] = b;
          pixelatedData.data[targetIndex + 3] = a;
        }
      }
    }
  }
  
  return pixelatedData;
}
