
/**
 * Core pixel-level image processing functions
 */

// Process a single row of pixels for facial transformations
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
    
    // Significantly increased the max influence distance for wider effect area
    const extendedMaxInfluence = maxInfluenceDistance * 2.0; // Increased from 1.2 to 2.0
    
    // Skip if outside approximate face area with extended region
    if (distFromCenter > extendedMaxInfluence) {
      // Just copy original pixel for areas outside the face
      for (let i = 0; i < 4; i++) {
        outputArray[index + i] = inputArray[index + i];
      }
      continue;
    }
    
    // Calculate transition factor - smooth falloff at edges using improved formula
    // Use quintic easing for even smoother edge transitions (improved from cubic)
    let transitionFactor = 0;
    if (distFromCenter <= innerEdge) {
      transitionFactor = 1.0;
    } else if (distFromCenter >= extendedMaxInfluence) {
      transitionFactor = 0.0;
    } else {
      // Quintic smoothstep for ultra-smooth transitions
      const t = (distFromCenter - innerEdge) / (extendedMaxInfluence - innerEdge);
      // Quintic interpolation: 6t^5 - 15t^4 + 10t^3
      transitionFactor = 1.0 - (t*t*t * (t * (t * 6 - 15) + 10));
    }
    
    // Calculate displacement based on facial feature sliders
    let displacementX = 0;
    let displacementY = 0;
    
    // Eye region transformations - SIGNIFICANTLY enlarged area
    if (Math.abs(normY + 0.25) < 0.4 && Math.abs(normX) < 0.6) {
      // Apply a distance-based scaling factor to ensure smooth transitions
      const eyeRegionFactor = smoothStep(0.4, 0.2, Math.abs(normY + 0.25)) * 
                             smoothStep(0.6, 0.3, Math.abs(normX));
                             
      displacementX += (sliderValues.eyeSize || 0) / 100 * normX * amplificationFactor * transitionFactor * eyeRegionFactor;
      displacementY += (sliderValues.eyeSize || 0) / 100 * normY * amplificationFactor * transitionFactor * eyeRegionFactor;
      displacementX += (sliderValues.eyeSpacing || 0) / 100 * (normX > 0 ? 1 : -1) * amplificationFactor * transitionFactor * eyeRegionFactor;
    }
    
    // Eyebrow region transformations - SIGNIFICANTLY enlarged
    if (Math.abs(normY + 0.4) < 0.25 && Math.abs(normX) < 0.6) {
      // Smooth transition for eyebrow region
      const eyebrowRegionFactor = smoothStep(0.25, 0.1, Math.abs(normY + 0.4)) * 
                                 smoothStep(0.6, 0.3, Math.abs(normX));
                                 
      displacementY -= (sliderValues.eyebrowHeight || 0) / 100 * amplificationFactor * transitionFactor * eyebrowRegionFactor;
    }
    
    // Nose region transformations - SIGNIFICANTLY enlarged
    if (Math.abs(normX) < 0.35 && normY > -0.45 && normY < 0.35) {
      // Calculate nose region influence with smooth falloff
      const noseXFactor = smoothStep(0.35, 0.15, Math.abs(normX));
      const noseYFactor = smoothStep(0.45, 0.25, Math.abs(normY - (-0.05)));
      const noseRegionFactor = noseXFactor * noseYFactor;
      
      displacementX += (sliderValues.noseWidth || 0) / 100 * normX * amplificationFactor * transitionFactor * noseRegionFactor;
      displacementY += (sliderValues.noseLength || 0) / 100 * (normY > 0 ? 1 : -1) * amplificationFactor * transitionFactor * noseRegionFactor;
    }
    
    // Mouth region transformations - SIGNIFICANTLY enlarged
    if (Math.abs(normX) < 0.5 && normY > -0.05 && normY < 0.55) {
      // Calculate mouth region influence with smooth falloff
      const mouthXFactor = smoothStep(0.5, 0.2, Math.abs(normX));
      const mouthYFactor = smoothStep(0.55, 0.25, Math.abs(normY - 0.25)) * 
                          smoothStep(1.0, 0.05, Math.abs(normY + 0.05));
      const mouthRegionFactor = mouthXFactor * mouthYFactor;
      
      displacementX += (sliderValues.mouthWidth || 0) / 100 * normX * amplificationFactor * transitionFactor * mouthRegionFactor;
      displacementY += (sliderValues.mouthHeight || 0) / 100 * (normY - 0.25) * amplificationFactor * transitionFactor * mouthRegionFactor;
    }
    
    // Overall face width transformations - expanded area substantially
    if (distFromCenter > 0.25 && distFromCenter < 2.0) {
      // Smooth falloff for face width
      const faceWidthFactor = smoothStep(2.0, 0.25, distFromCenter) * 
                             (1.0 - smoothStep(0.25, 0.6, distFromCenter));
                             
      displacementX += (sliderValues.faceWidth || 0) / 100 * normX * amplificationFactor * transitionFactor * faceWidthFactor;
    }
    
    // Chin shape transformations - significantly enlarged
    if (normY > 0.15 && Math.abs(normX) < 0.6) {
      // Smooth transition for chin area
      const chinFactor = smoothStep(0.15, 0.35, normY) * 
                        smoothStep(0.6, 0.2, Math.abs(normX));
                        
      displacementY += (sliderValues.chinShape || 0) / 100 * (normY - 0.4) * amplificationFactor * transitionFactor * chinFactor;
    }
    
    // Jawline transformations - significantly enlarged
    if (normY > 0.0 && Math.abs(normX) > 0.1 && Math.abs(normX) < 0.9) {
      // Smooth transition for jawline area
      const jawFactor = smoothStep(0.0, 0.2, normY) * 
                       smoothStep(0.9, 0.5, Math.abs(normX)) *
                       smoothStep(0.1, 0.3, Math.abs(normX));
                       
      displacementX += (sliderValues.jawline || 0) / 100 * (normX > 0 ? 1 : -1) * amplificationFactor * transitionFactor * jawFactor;
    }
    
    // Apply the calculated displacement with bounds checking
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

// Helper function for smooth step interpolation
const smoothStep = (edge0: number, edge1: number, x: number): number => {
  // Clamp x to 0..1 range
  x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  // Evaluate polynomial
  return x * x * (3 - 2 * x);
};

// Calculate smooth transition factor for transformation boundary
export const calculateTransitionFactor = (
  distFromCenter: number, 
  innerEdge: number, 
  maxDistance: number
): number => {
  if (distFromCenter <= innerEdge) {
    return 1.0;
  }
  if (distFromCenter >= maxDistance) {
    return 0.0;
  }
  // Improved quintic interpolation for better transition
  const t = (distFromCenter - innerEdge) / (maxDistance - innerEdge);
  // Quintic interpolation: 6t^5 - 15t^4 + 10t^3
  return 1.0 - (t*t*t * (t * (t * 6 - 15) + 10));
};

// Apply improved bilinear interpolation for smoother pixel sampling
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
  
  // Calculate pixel indices with boundary checking
  const topLeft = (Math.min(y1, height-1) * width + Math.min(x1, width-1)) * 4;
  const topRight = (Math.min(y1, height-1) * width + Math.min(x2, width-1)) * 4;
  const bottomLeft = (Math.min(y2, height-1) * width + Math.min(x1, width-1)) * 4;
  const bottomRight = (Math.min(y2, height-1) * width + Math.min(x2, width-1)) * 4;
  
  // Interpolate for each color channel with improved algorithm
  for (let c = 0; c < 3; c++) {
    // Cubic interpolation for smoother results
    // Calculate horizontal interpolations
    const top = cubicInterpolate(
      inputArray[topLeft + c], 
      inputArray[topRight + c], 
      xWeight
    );
    
    const bottom = cubicInterpolate(
      inputArray[bottomLeft + c], 
      inputArray[bottomRight + c], 
      xWeight
    );
    
    // Then vertical interpolation
    let interpolated = cubicInterpolate(top, bottom, yWeight);
    
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
