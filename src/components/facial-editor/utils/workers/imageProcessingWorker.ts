/**
 * Web Worker for image processing operations
 * This runs in a separate thread to prevent UI blocking
 */

// Note: Using self directly since we're in a worker context
const workerSelf = self as unknown as Worker;

// Send a ready message back to the main thread
console.log("Worker initialized");
workerSelf.postMessage({ status: 'ready' });

// Process messages from main thread
workerSelf.addEventListener('message', (event: MessageEvent) => {
  const { command, originalImageData, params } = event.data;
  
  if (command === 'process') {
    processImageData(originalImageData, params);
  }
});

/**
 * Process image data with facial transformations
 */
function processImageData(originalImageData: any, params: any) {
  try {
    const { width, height } = originalImageData;
    const {
      centerX,
      centerY,
      halfFaceWidth,
      halfFaceHeight,
      innerEdge,
      maxInfluenceDistance,
      sliderValues,
      amplificationFactor,
      safetyMargin
    } = params;
    
    // Performance optimization: Create output array for the processed image
    // Using SharedArrayBuffer for faster data transfer if available
    const outputData = new Uint8ClampedArray(originalImageData.data.length);
    
    // Start time for performance measurement
    const startTime = performance.now();
    
    // Process image in chunks for better responsiveness
    const chunkSize = 40; // Increased chunk size for better performance
    const chunks = Math.ceil(height / chunkSize);
    
    // Process each chunk of rows
    for (let chunk = 0; chunk < chunks; chunk++) {
      const startRow = chunk * chunkSize;
      const endRow = Math.min((chunk + 1) * chunkSize, height);
      
      // Process rows in this chunk
      for (let y = startRow; y < endRow; y++) {
        processRow(
          y,
          width,
          height,
          originalImageData.data,
          outputData,
          centerX,
          centerY,
          halfFaceWidth,
          halfFaceHeight,
          innerEdge,
          maxInfluenceDistance,
          sliderValues,
          amplificationFactor,
          safetyMargin
        );
      }
    }
    
    // Calculate processing time
    const processingTime = performance.now() - startTime;
    
    // Send processed data back to main thread
    workerSelf.postMessage(
      {
        processedData: outputData.buffer,
        width,
        height,
        processingTime
      }, 
      [outputData.buffer]
    );
  } catch (error: any) {
    // Report errors back to main thread
    workerSelf.postMessage({
      error: error.message || 'Unknown error in worker'
    });
  }
}

/**
 * Calculate smooth transition factor for transformation boundary
 */
function calculateTransitionFactor(distFromCenter: number, innerEdge: number, maxDistance: number): number {
  if (distFromCenter <= innerEdge) {
    return 1.0;
  }
  if (distFromCenter >= maxDistance) {
    return 0.0;
  }
  
  // Optimized curve calculation - uses fewer operations
  const t = (distFromCenter - innerEdge) / (maxDistance - innerEdge);
  return 1.0 - (t * t * (3 - 2 * t));
}

/**
 * Apply bilinear interpolation for smoother pixel sampling - performance optimized
 */
function bilinearInterpolation(
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  inputData: Uint8ClampedArray, 
  outputData: Uint8ClampedArray, 
  targetIndex: number
) {
  // Fast integer math version
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  // Calculate weights - optimized to avoid multiple calculations
  const xWeight = x - x1;
  const yWeight = y - y1;
  const invXWeight = 1 - xWeight;
  const invYWeight = 1 - yWeight;
  
  // Cache indices for better performance
  const topLeft = (y1 * width + x1) * 4;
  const topRight = (y1 * width + x2) * 4;
  const bottomLeft = (y2 * width + x1) * 4;
  const bottomRight = (y2 * width + x2) * 4;
  
  // Interpolate for RGB channels using fewer multiplications
  const w1 = invXWeight * invYWeight;
  const w2 = xWeight * invYWeight;
  const w3 = invXWeight * yWeight;
  const w4 = xWeight * yWeight;
  
  // Process RGB channels together for better cache coherency
  for (let c = 0; c < 3; c++) {
    const idx = targetIndex + c;
    outputData[idx] = Math.round(
      inputData[topLeft + c] * w1 +
      inputData[topRight + c] * w2 +
      inputData[bottomLeft + c] * w3 +
      inputData[bottomRight + c] * w4
    );
  }
  
  // Alpha channel stays the same
  outputData[targetIndex + 3] = inputData[topLeft + 3];
}

/**
 * Process a single row of pixels for facial transformations - performance optimized
 */
function processRow(
  y: number,
  width: number,
  height: number,
  inputData: Uint8ClampedArray,
  outputData: Uint8ClampedArray,
  centerX: number,
  centerY: number,
  halfFaceWidth: number,
  halfFaceHeight: number,
  innerEdge: number,
  maxInfluenceDistance: number,
  sliderValues: Record<string, number>,
  amplificationFactor: number,
  safetyMargin: number
) {
  const invHalfFaceWidth = 1.0 / halfFaceWidth;
  const invHalfFaceHeight = 1.0 / halfFaceHeight;
  const normY = (y - centerY) * invHalfFaceHeight;
  const normYSquared = normY * normY;
  
  // Pre-calculate common values
  const eyeSizeEffect = (sliderValues.eyeSize || 0) / 100 * amplificationFactor;
  const eyebrowHeightEffect = (sliderValues.eyebrowHeight || 0) / 100 * amplificationFactor;
  const eyeSpacingEffect = (sliderValues.eyeSpacing || 0) / 100 * amplificationFactor;
  const noseWidthEffect = (sliderValues.noseWidth || 0) / 100 * amplificationFactor;
  const noseLengthEffect = (sliderValues.noseLength || 0) / 100 * amplificationFactor;
  const mouthWidthEffect = (sliderValues.mouthWidth || 0) / 100 * amplificationFactor;
  const mouthHeightEffect = (sliderValues.mouthHeight || 0) / 100 * amplificationFactor;
  const faceWidthEffect = (sliderValues.faceWidth || 0) / 100 * amplificationFactor;
  const chinShapeEffect = (sliderValues.chinShape || 0) / 100 * amplificationFactor;
  
  // Eye region Y checks
  const isEyeRegionY = Math.abs(normY + 0.25) < 0.2;
  const isEyebrowRegionY = Math.abs(normY + 0.4) < 0.1;
  const isNoseRegionY1 = normY > -0.3;
  const isNoseRegionY2 = normY < 0.2;
  const isMouthRegionY1 = normY > 0.1;
  const isMouthRegionY2 = normY < 0.4;
  const isChinRegionY = normY > 0.3;
  
  for (let x = 0; x < width; x++) {
    // Calculate normalized position relative to face center - optimized calculation
    const normX = (x - centerX) * invHalfFaceWidth;
    const normXSquared = normX * normX;
    
    // Fast elliptical distance calculation
    const distFromCenter = Math.sqrt(normXSquared + normYSquared * 1.2);
    
    // Get the current pixel index
    const index = (y * width + x) * 4;
    
    // Skip if outside maximum influence area for performance
    if (distFromCenter > maxInfluenceDistance * 1.2) {
      // Fast copy for unchanged pixels
      outputData[index] = inputData[index];
      outputData[index + 1] = inputData[index + 1];
      outputData[index + 2] = inputData[index + 2];
      outputData[index + 3] = inputData[index + 3];
      continue;
    }
    
    // Calculate transition factor - smooth falloff at edges
    const transitionFactor = calculateTransitionFactor(distFromCenter, innerEdge, maxInfluenceDistance);
    
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
    
    // Nose region transformations - with cached region checks
    if (Math.abs(normX) < 0.2 && isNoseRegionY1 && isNoseRegionY2) {
      displacementX += noseWidthEffect * normX * transitionFactor;
      displacementY += noseLengthEffect * (normY > 0 ? 1 : -1) * transitionFactor;
    }
    
    // Mouth region transformations - with cached region checks
    if (Math.abs(normX) < 0.3 && isMouthRegionY1 && isMouthRegionY2) {
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
    
    // Use bilinear interpolation for smoother results
    bilinearInterpolation(
      sampleX,
      sampleY,
      width,
      height,
      inputData,
      outputData,
      index
    );
  }
}
