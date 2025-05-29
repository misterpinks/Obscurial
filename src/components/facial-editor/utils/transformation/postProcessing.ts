
/**
 * Post-processing utilities for smoothing transformation artifacts
 */

// Apply Gaussian blur to smooth out transformation artifacts
export const applySmoothingFilter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  smoothingRadius: number = 2
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const smoothedData = ctx.createImageData(width, height);
  
  // Apply a simple box blur for smoothing
  applyBoxBlur(imageData.data, smoothedData.data, width, height, smoothingRadius);
  
  ctx.putImageData(smoothedData, 0, 0);
};

// Apply edge-preserving smoothing specifically for facial transformation boundaries
export const applyEdgePreservingSmoothing = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  faceWidth: number,
  faceHeight: number
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const smoothedData = ctx.createImageData(width, height);
  
  // Copy original data first
  for (let i = 0; i < imageData.data.length; i++) {
    smoothedData.data[i] = imageData.data[i];
  }
  
  // Apply selective smoothing only near transformation boundaries
  const halfFaceWidth = faceWidth / 2;
  const halfFaceHeight = faceHeight / 2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const normX = (x - centerX) / halfFaceWidth;
      const normY = (y - centerY) / halfFaceHeight;
      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      
      // Apply smoothing near transformation boundaries (0.8 to 1.2 distance from center)
      if (distFromCenter > 0.8 && distFromCenter < 1.2) {
        const smoothingStrength = Math.min(1.0, Math.max(0.0, 
          1.0 - Math.abs(distFromCenter - 1.0) / 0.2
        ));
        
        applySmoothingAtPixel(
          imageData.data, 
          smoothedData.data, 
          x, y, width, height, 
          smoothingStrength
        );
      }
    }
  }
  
  ctx.putImageData(smoothedData, 0, 0);
};

// Apply smoothing at a specific pixel location
const applySmoothingAtPixel = (
  originalData: Uint8ClampedArray,
  smoothedData: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  strength: number
) => {
  const index = (y * width + x) * 4;
  
  // Sample surrounding pixels for averaging
  let totalR = 0, totalG = 0, totalB = 0;
  let count = 0;
  
  const radius = 2;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIndex = (ny * width + nx) * 4;
        totalR += originalData[nIndex];
        totalG += originalData[nIndex + 1];
        totalB += originalData[nIndex + 2];
        count++;
      }
    }
  }
  
  if (count > 0) {
    const avgR = totalR / count;
    const avgG = totalG / count;
    const avgB = totalB / count;
    
    // Blend original and smoothed values based on strength
    smoothedData[index] = originalData[index] * (1 - strength) + avgR * strength;
    smoothedData[index + 1] = originalData[index + 1] * (1 - strength) + avgG * strength;
    smoothedData[index + 2] = originalData[index + 2] * (1 - strength) + avgB * strength;
    smoothedData[index + 3] = originalData[index + 3]; // Keep alpha unchanged
  }
};

// Simple box blur implementation
const applyBoxBlur = (
  originalData: Uint8ClampedArray,
  smoothedData: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) => {
  // Horizontal pass
  const tempData = new Uint8ClampedArray(originalData.length);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      let totalR = 0, totalG = 0, totalB = 0;
      let count = 0;
      
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        if (nx >= 0 && nx < width) {
          const nIndex = (y * width + nx) * 4;
          totalR += originalData[nIndex];
          totalG += originalData[nIndex + 1];
          totalB += originalData[nIndex + 2];
          count++;
        }
      }
      
      tempData[index] = totalR / count;
      tempData[index + 1] = totalG / count;
      tempData[index + 2] = totalB / count;
      tempData[index + 3] = originalData[index + 3];
    }
  }
  
  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      let totalR = 0, totalG = 0, totalB = 0;
      let count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < height) {
          const nIndex = (ny * width + x) * 4;
          totalR += tempData[nIndex];
          totalG += tempData[nIndex + 1];
          totalB += tempData[nIndex + 2];
          count++;
        }
      }
      
      smoothedData[index] = totalR / count;
      smoothedData[index + 1] = totalG / count;
      smoothedData[index + 2] = totalB / count;
      smoothedData[index + 3] = tempData[index + 3];
    }
  }
};
