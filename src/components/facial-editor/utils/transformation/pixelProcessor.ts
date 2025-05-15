
/**
 * Core pixel-level image processing functions
 * Enhanced for maximum performance with minimal visual artifacts
 */

// Constants for optimization
const MIN_NOISE_LEVEL = 0.01;
const CUBIC_WEIGHT_PRECISION = 1000;

// Process a single row of pixels for facial transformations with continuous field
export const processRow = (
  y: number,
  width: number,
  height: number,
  inputData: ImageData | Uint8ClampedArray,
  outputData: ImageData | Uint8ClampedArray,
  centerX: number,
  centerY: number,
  halfFaceWidth: number,
  halfFaceHeight: number,
  innerEdge: number,
  maxInfluenceDistance: number,
  sliderValues: Record<string, number>,
  amplificationFactor: number,
  safetyMargin: number
) => {
  const inputArray = inputData instanceof ImageData ? inputData.data : inputData;
  const outputArray = outputData instanceof ImageData ? outputData.data : outputData;
  
  // Pre-calculate inverse values for better performance
  const invHalfFaceWidth = 1.0 / halfFaceWidth;
  const invHalfFaceHeight = 1.0 / halfFaceHeight;
  
  // Precalculate normalized Y values
  const normY = (y - centerY) * invHalfFaceHeight;
  const normYSquared = normY * normY * 1.2; // Pre-multiply by elliptical factor
  
  // Pre-calculate common slider effect values
  const eyeSizeEffect = (sliderValues.eyeSize || 0) / 100 * amplificationFactor;
  const eyebrowHeightEffect = (sliderValues.eyebrowHeight || 0) / 100 * amplificationFactor;
  const eyeSpacingEffect = (sliderValues.eyeSpacing || 0) / 100 * amplificationFactor;
  const noseWidthEffect = (sliderValues.noseWidth || 0) / 100 * amplificationFactor;
  const noseLengthEffect = (sliderValues.noseLength || 0) / 100 * amplificationFactor;
  const mouthWidthEffect = (sliderValues.mouthWidth || 0) / 100 * amplificationFactor;
  const mouthHeightEffect = (sliderValues.mouthHeight || 0) / 100 * amplificationFactor;
  const faceWidthEffect = (sliderValues.faceWidth || 0) / 100 * amplificationFactor;
  const chinShapeEffect = (sliderValues.chinShape || 0) / 100 * amplificationFactor;
  
  // Cache region checks for Y coordinate
  const isEyeRegionY = Math.abs(normY + 0.25) < 0.2;
  const isEyebrowRegionY = Math.abs(normY + 0.4) < 0.1;
  const isNoseRegionY = normY > -0.3 && normY < 0.2;
  const isMouthRegionY = normY > 0.1 && normY < 0.4;
  const isChinRegionY = normY > 0.3;
  
  // Use noise reduction by default
  const noiseLevel = Math.max(MIN_NOISE_LEVEL, sliderValues.noiseLevel || 0);

  for (let x = 0; x < width; x++) {
    // Calculate normalized position relative to face center - optimized calculation
    const normX = (x - centerX) * invHalfFaceWidth;
    const normXSquared = normX * normX;
    
    // Fast elliptical distance approximation
    const distFromCenter = Math.sqrt(normXSquared + normYSquared);
    
    // Get the current pixel index
    const index = (y * width + x) * 4;
    
    // Skip calculation for pixels far outside face area
    if (distFromCenter > maxInfluenceDistance * 1.2) {
      // Just copy original pixel for areas outside the face
      copyPixel(x, y, width, inputArray, outputArray, index);
      continue;
    }
    
    // Calculate transition factor - smooth falloff at edges
    const transitionFactor = calculateTransitionFactor(distFromCenter, innerEdge, maxInfluenceDistance);
    
    // Skip complex calculation if transition factor is too small
    if (transitionFactor < 0.01) {
      copyPixel(x, y, width, inputArray, outputArray, index);
      continue;
    }
    
    // Calculate displacement based on facial feature sliders
    let displacementX = 0;
    let displacementY = 0;
    
    // Eye region transformations - with cached region check
    if (isEyeRegionY && Math.abs(normX) < 0.4) {
      displacementX += eyeSizeEffect * normX * transitionFactor;
      displacementY += eyeSizeEffect * normY * transitionFactor;
      displacementX += eyeSpacingEffect * (normX > 0 ? 1 : -1) * transitionFactor;
    }
    
    // Eyebrow region transformations - with cached region check
    if (isEyebrowRegionY && Math.abs(normX) < 0.4) {
      displacementY -= eyebrowHeightEffect * transitionFactor;
    }
    
    // Nose region transformations - with cached region check
    if (Math.abs(normX) < 0.2 && isNoseRegionY) {
      displacementX += noseWidthEffect * normX * transitionFactor;
      displacementY += noseLengthEffect * (normY > 0 ? 1 : -1) * transitionFactor;
    }
    
    // Mouth region transformations - with cached region check
    if (Math.abs(normX) < 0.3 && isMouthRegionY) {
      displacementX += mouthWidthEffect * normX * transitionFactor;
      displacementY += mouthHeightEffect * (normY - 0.25) * transitionFactor;
    }
    
    // Overall face width transformations
    if (distFromCenter > 0.4 && distFromCenter < 1.0) {
      displacementX += faceWidthEffect * normX * transitionFactor;
    }
    
    // Chin shape transformations
    if (isChinRegionY && Math.abs(normX) < 0.3) {
      displacementY += chinShapeEffect * (normY - 0.4) * transitionFactor;
    }
    
    // Apply the calculated displacement with bounds checking
    const sampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, x - displacementX));
    const sampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, y - displacementY));
    
    // Use optimized bilinear interpolation for better performance
    improvedBilinearInterpolation(
      sampleX, 
      sampleY, 
      width, 
      height,
      inputArray, 
      outputArray, 
      index,
      noiseLevel
    );
  }
};

// Helper function to copy pixel directly from source to destination - inlined for performance
export const copyPixel = (
  x: number,
  y: number,
  width: number,
  inputArray: Uint8ClampedArray,
  outputArray: Uint8ClampedArray,
  targetIndex: number
) => {
  const sourceIndex = targetIndex; // Since x,y are the same, just use targetIndex
  outputArray[targetIndex] = inputArray[sourceIndex];
  outputArray[targetIndex + 1] = inputArray[sourceIndex + 1];
  outputArray[targetIndex + 2] = inputArray[sourceIndex + 2];
  outputArray[targetIndex + 3] = inputArray[sourceIndex + 3];
};

// Calculate smooth transition factor with optimized calculation
export const calculateTransitionFactor = (
  distFromCenter: number, 
  innerEdge: number, 
  maxDistance: number
): number => {
  if (distFromCenter <= innerEdge) return 1.0;
  if (distFromCenter >= maxDistance) return 0.0;
  
  // Fast cubic interpolation
  const t = (distFromCenter - innerEdge) / (maxDistance - innerEdge);
  return 1.0 - (t * t * (3 - 2 * t));
};

// Apply improved bilinear interpolation with performance optimization
export const improvedBilinearInterpolation = (
  x: number, 
  y: number,
  width: number,
  height: number,
  inputArray: Uint8ClampedArray, 
  outputArray: Uint8ClampedArray, 
  targetIndex: number,
  noiseLevel: number = 0
) => {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  // Calculate weights once for all channels
  const xWeight = x - x1;
  const yWeight = y - y1;
  const invXWeight = 1 - xWeight;
  const invYWeight = 1 - yWeight;
  
  // Cache weights for better performance
  const w1 = invXWeight * invYWeight;
  const w2 = xWeight * invYWeight;
  const w3 = invXWeight * yWeight;
  const w4 = xWeight * yWeight;
  
  // Calculate pixel indices with optimized boundary checks
  const topLeft = (Math.min(Math.max(0, y1), height-1) * width + Math.min(Math.max(0, x1), width-1)) * 4;
  const topRight = (Math.min(Math.max(0, y1), height-1) * width + Math.min(Math.max(0, x2), width-1)) * 4;
  const bottomLeft = (Math.min(Math.max(0, y2), height-1) * width + Math.min(Math.max(0, x1), width-1)) * 4;
  const bottomRight = (Math.min(Math.max(0, y2), height-1) * width + Math.min(Math.max(0, x2), width-1)) * 4;
  
  // Process all color channels efficiently
  for (let c = 0; c < 3; c++) {
    // Compute weighted average with single calculation
    let interpolated = Math.round(
      inputArray[topLeft + c] * w1 +
      inputArray[topRight + c] * w2 +
      inputArray[bottomLeft + c] * w3 +
      inputArray[bottomRight + c] * w4
    );
    
    // Add randomized noise if needed - optimized for performance
    if (noiseLevel > 0) {
      const noise = (Math.random() - 0.5) * noiseLevel * 2.5;
      interpolated = Math.max(0, Math.min(255, Math.round(interpolated + noise)));
    }
    
    outputArray[targetIndex + c] = interpolated;
  }
  
  // Alpha channel stays the same
  outputArray[targetIndex + 3] = inputArray[topLeft + 3];
};

// Original bilinear interpolation kept for reference and backward compatibility
export const bilinearInterpolation = (
  x: number, 
  y: number, 
  width: number,
  inputArray: Uint8ClampedArray, 
  outputArray: Uint8ClampedArray, 
  targetIndex: number,
  noiseLevel: number = 0
) => {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = x1 + 1;
  const y2 = y1 + 1;
  
  const xWeight = x - x1;
  const yWeight = y - y1;
  
  const topLeft = (y1 * width + x1) * 4;
  const topRight = (y1 * width + x2) * 4;
  const bottomLeft = (y2 * width + x1) * 4;
  const bottomRight = (y2 * width + x2) * 4;
  
  // Interpolate for each color channel
  for (let c = 0; c < 3; c++) {
    const top = inputArray[topLeft + c] * (1 - xWeight) + inputArray[topRight + c] * xWeight;
    const bottom = inputArray[bottomLeft + c] * (1 - xWeight) + inputArray[bottomRight + c] * xWeight;
    let interpolated = Math.round(top * (1 - yWeight) + bottom * yWeight);
    
    // Add randomized noise if needed
    if (noiseLevel > 0) {
      const noise = (Math.random() - 0.5) * noiseLevel * 2.5;
      interpolated = Math.max(0, Math.min(255, Math.round(interpolated + noise)));
    }
    
    outputArray[targetIndex + c] = interpolated;
  }
  
  // Alpha channel stays the same
  outputArray[targetIndex + 3] = inputArray[topLeft + 3];
};
