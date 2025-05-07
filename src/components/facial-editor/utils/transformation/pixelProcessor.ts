
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
    
    // Skip if outside approximate face area
    if (distFromCenter > maxInfluenceDistance) {
      // Just copy original pixel for areas outside the face
      for (let i = 0; i < 4; i++) {
        outputArray[index + i] = inputArray[index + i];
      }
      continue;
    }
    
    // Calculate transition factor - smooth falloff at edges
    const transitionFactor = calculateTransitionFactor(distFromCenter, innerEdge, maxInfluenceDistance);
    
    // Calculate displacement based on facial feature sliders
    let displacementX = 0;
    let displacementY = 0;
    
    // Eye region transformations
    if (Math.abs(normY + 0.25) < 0.2 && Math.abs(normX) < 0.4) {
      displacementX += (sliderValues.eyeSize || 0) / 100 * normX * amplificationFactor * transitionFactor;
      displacementY += (sliderValues.eyeSize || 0) / 100 * normY * amplificationFactor * transitionFactor;
      displacementX += (sliderValues.eyeSpacing || 0) / 100 * (normX > 0 ? 1 : -1) * amplificationFactor * transitionFactor;
    }
    
    // Eyebrow region transformations
    if (Math.abs(normY + 0.4) < 0.1 && Math.abs(normX) < 0.4) {
      displacementY -= (sliderValues.eyebrowHeight || 0) / 100 * amplificationFactor * transitionFactor;
    }
    
    // Nose region transformations
    if (Math.abs(normX) < 0.2 && normY > -0.3 && normY < 0.2) {
      displacementX += (sliderValues.noseWidth || 0) / 100 * normX * amplificationFactor * transitionFactor;
      displacementY += (sliderValues.noseLength || 0) / 100 * (normY > 0 ? 1 : -1) * amplificationFactor * transitionFactor;
    }
    
    // Mouth region transformations
    if (Math.abs(normX) < 0.3 && normY > 0.1 && normY < 0.4) {
      displacementX += (sliderValues.mouthWidth || 0) / 100 * normX * amplificationFactor * transitionFactor;
      displacementY += (sliderValues.mouthHeight || 0) / 100 * (normY - 0.25) * amplificationFactor * transitionFactor;
    }
    
    // Overall face width transformations
    if (distFromCenter > 0.4 && distFromCenter < 1.0) {
      displacementX += (sliderValues.faceWidth || 0) / 100 * normX * amplificationFactor * transitionFactor;
    }
    
    // Chin shape transformations
    if (normY > 0.3 && Math.abs(normX) < 0.3) {
      displacementY += (sliderValues.chinShape || 0) / 100 * (normY - 0.4) * amplificationFactor * transitionFactor;
    }
    
    // Jawline transformations
    if (normY > 0.15 && Math.abs(normX) > 0.2 && Math.abs(normX) < 0.6) {
      displacementX += (sliderValues.jawline || 0) / 100 * (normX > 0 ? 1 : -1) * amplificationFactor * transitionFactor;
    }
    
    // Apply the calculated displacement with bounds checking
    const sampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, x - displacementX));
    const sampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, y - displacementY));
    
    // Use bilinear interpolation for smoother results
    bilinearInterpolation(
      sampleX, 
      sampleY, 
      width, 
      inputArray, 
      outputArray, 
      index,
      sliderValues.noiseLevel || 0
    );
  }
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
  // Smooth cubic interpolation for better transition
  const t = (distFromCenter - innerEdge) / (maxDistance - innerEdge);
  return 1.0 - (t * t * (3 - 2 * t));
};

// Apply bilinear interpolation for smoother pixel sampling
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
