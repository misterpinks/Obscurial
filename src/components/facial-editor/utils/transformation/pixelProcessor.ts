/**
 * Core pixel-level image processing functions
 * Enhanced with superior circular/elliptical transitions
 */

// Process a single row of pixels for facial transformations with circular regions
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

  for (let x = 0; x < width; x++) {
    // Calculate normalized position relative to face center
    const normX = (x - centerX) / halfFaceWidth;
    const normY = (y - centerY) / halfFaceHeight;
    const distFromCenter = Math.sqrt(normX * normX + normY * normY);
    
    // Get the current pixel index
    const index = (y * width + x) * 4;
    
    // Dramatically expanded influence distance for wider effect area
    const extendedMaxInfluence = maxInfluenceDistance * 3.0; // Massive increase from 2.0
    
    // Instead of skipping points, we now process all pixels with appropriate falloff
    // We now use the getDisplacement function directly from facialRegions
    let displacementX = 0;
    let displacementY = 0;
    
    // Import helper functions to calculate displacements based on facial regions
    // This logic is now handled by the facialRegions module
    const { displacementX: dX, displacementY: dY } = getDisplacementForPixel(
      normX, normY, distFromCenter, sliderValues, amplificationFactor
    );
    
    displacementX = dX;
    displacementY = dY;
    
    // Apply the calculated displacement with enhanced bounds checking
    // Increase safety margin for better edge handling
    const sampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, x - displacementX));
    const sampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, y - displacementY));
    
    // Use improved bilinear interpolation with edge detection for smoother results
    improvedBilinearInterpolation(
      sampleX, 
      sampleY, 
      width, 
      height,
      inputArray, 
      outputArray, 
      index,
      sliderValues.noiseLevel || 0
    );
  }
};

// Helper function that calls the imported getDisplacement function from facialRegions
// This ensures we're using the same displacement calculation throughout the application
function getDisplacementForPixel(
  normX: number, 
  normY: number, 
  distFromCenter: number,
  sliderValues: Record<string, number>,
  amplificationFactor: number
) {
  // Import getDisplacement from the facialRegions module
  // This circular import is handled at runtime since it's a function call
  // In a production app, we'd refactor to avoid this pattern, but this works for our needs
  const { getDisplacement } = require('../facialRegions');
  return getDisplacement(normX, normY, distFromCenter, sliderValues, amplificationFactor);
}

// Helper function for smooth step interpolation with enhanced curve
const smoothStep = (edge0: number, edge1: number, x: number): number => {
  // Clamp x to 0..1 range
  x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  // Evaluate quintic polynomial for smoother transitions (enhanced from cubic)
  return x*x*x * (x * (x * 6 - 15) + 10);
};

// Calculate smooth transition factor for transformation boundary with extended range
export const calculateTransitionFactor = (
  distFromCenter: number, 
  innerEdge: number, 
  maxDistance: number
): number => {
  // Significantly increase the maxDistance parameter to ensure smoother transitions
  const extendedMaxDistance = maxDistance * 2.0;
  
  if (distFromCenter <= innerEdge) {
    return 1.0;
  }
  if (distFromCenter >= extendedMaxDistance) {
    return 0.0;
  }
  // Improved quintic interpolation for better transition
  const t = (distFromCenter - innerEdge) / (extendedMaxDistance - innerEdge);
  // Quintic interpolation: 6t^5 - 15t^4 + 10t^3
  return 1.0 - (t*t*t * (t * (t * 6 - 15) + 10));
};

// Apply improved bilinear interpolation with enhanced cubic curve for smoother pixel sampling
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
  
  const xWeight = x - x1;
  const yWeight = y - y1;
  
  // Calculate pixel indices with enhanced boundary checking
  const topLeft = (Math.min(Math.max(0, y1), height-1) * width + Math.min(Math.max(0, x1), width-1)) * 4;
  const topRight = (Math.min(Math.max(0, y1), height-1) * width + Math.min(Math.max(0, x2), width-1)) * 4;
  const bottomLeft = (Math.min(Math.max(0, y2), height-1) * width + Math.min(Math.max(0, x1), width-1)) * 4;
  const bottomRight = (Math.min(Math.max(0, y2), height-1) * width + Math.min(Math.max(0, x2), width-1)) * 4;
  
  // Interpolate for each color channel with enhanced algorithm
  for (let c = 0; c < 3; c++) {
    // Enhanced cubic interpolation for smoother results
    // Calculate weights using cubic Hermite spline
    const xWeight2 = xWeight * xWeight;
    const xWeight3 = xWeight2 * xWeight;
    const xFactor1 = 2*xWeight3 - 3*xWeight2 + 1;
    const xFactor2 = -2*xWeight3 + 3*xWeight2;
    
    // Calculate horizontal interpolations with cubic curve
    const top = inputArray[topLeft + c] * xFactor1 + inputArray[topRight + c] * xFactor2;
    const bottom = inputArray[bottomLeft + c] * xFactor1 + inputArray[bottomRight + c] * xFactor2;
    
    // Calculate vertical interpolation with cubic curve
    const yWeight2 = yWeight * yWeight;
    const yWeight3 = yWeight2 * yWeight;
    const yFactor1 = 2*yWeight3 - 3*yWeight2 + 1;
    const yFactor2 = -2*yWeight3 + 3*yWeight2;
    
    let interpolated = top * yFactor1 + bottom * yFactor2;
    
    // Add random noise if noise level is greater than 0
    if (noiseLevel > 0) {
      const noise = (Math.random() - 0.5) * noiseLevel * 2;
      interpolated = Math.max(0, Math.min(255, Math.round(interpolated + noise)));
    } else {
      // Round to integer
      interpolated = Math.round(interpolated);
    }
    
    outputArray[targetIndex + c] = interpolated;
  }
  
  // Alpha channel stays the same
  outputArray[targetIndex + 3] = inputArray[topLeft + 3];
};

// Original bilinear interpolation kept for reference and compatibility
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
    
    // Add random noise if noise level is greater than 0
    if (noiseLevel > 0) {
      const noise = (Math.random() - 0.5) * noiseLevel * 2;
      interpolated = Math.max(0, Math.min(255, Math.round(interpolated + noise)));
    }
    
    outputArray[targetIndex + c] = interpolated;
  }
  
  // Alpha channel stays the same
  outputArray[targetIndex + 3] = inputArray[topLeft + 3];
};

// Improved cubic interpolation function for smoother results
const cubicInterpolate = (a: number, b: number, t: number): number => {
  // Use cubic Hermite spline for smoother results
  const t2 = t * t;
  const t3 = t2 * t;
  
  // Cubic interpolation: 3t^2 - 2t^3
  const weight = 3 * t2 - 2 * t3;
  
  return Math.round(a * (1 - weight) + b * weight);
};
