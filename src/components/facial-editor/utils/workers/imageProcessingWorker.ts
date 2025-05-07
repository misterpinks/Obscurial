
/**
 * Image Processing Worker
 * 
 * This worker handles processor-intensive image transformations off the main thread
 * to prevent UI freezing during complex operations.
 */

// Send ready message when worker initializes
self.postMessage({ status: 'ready', message: 'Image processing worker initialized' });

// Helper function: Calculate transition factor (copied from transformCore for worker independence)
function calculateTransitionFactor(
  distFromCenter: number,
  innerEdge: number,
  maxInfluenceDistance: number
): number {
  if (distFromCenter <= innerEdge) return 1.0;
  if (distFromCenter >= maxInfluenceDistance) return 0.0;
  
  const transitionZone = maxInfluenceDistance - innerEdge;
  const fadeFactor = 1.0 - ((distFromCenter - innerEdge) / transitionZone);
  
  return fadeFactor * fadeFactor;
}

// Helper function: Bilinear interpolation (copied from transformCore)
function bilinearInterpolation(
  originalData: Uint8ClampedArray,
  x: number, 
  y: number, 
  width: number,
  height: number,
  outputData: Uint8ClampedArray,
  index: number
): void {
  const sampleX = Math.max(0, Math.min(width - 1.001, x));
  const sampleY = Math.max(0, Math.min(height - 1.001, y));
  
  const x1 = Math.floor(sampleX);
  const y1 = Math.floor(sampleY);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  const xWeight = sampleX - x1;
  const yWeight = sampleY - y1;
  
  const topLeftOffset = (y1 * width + x1) * 4;
  const topRightOffset = (y1 * width + x2) * 4;
  const bottomLeftOffset = (y2 * width + x1) * 4;
  const bottomRightOffset = (y2 * width + x2) * 4;
  
  // Red channel
  const topLeftR = originalData[topLeftOffset];
  const topRightR = originalData[topRightOffset];
  const bottomLeftR = originalData[bottomLeftOffset];
  const bottomRightR = originalData[bottomRightOffset];
  
  const topR = topLeftR + (topRightR - topLeftR) * xWeight;
  const bottomR = bottomLeftR + (bottomRightR - bottomLeftR) * xWeight;
  outputData[index] = topR + (bottomR - topR) * yWeight;
  
  // Green channel
  const topLeftG = originalData[topLeftOffset + 1];
  const topRightG = originalData[topRightOffset + 1];
  const bottomLeftG = originalData[bottomLeftOffset + 1];
  const bottomRightG = originalData[bottomRightOffset + 1];
  
  const topG = topLeftG + (topRightG - topLeftG) * xWeight;
  const bottomG = bottomLeftG + (bottomRightG - bottomLeftG) * xWeight;
  outputData[index + 1] = topG + (bottomG - topG) * yWeight;
  
  // Blue channel
  const topLeftB = originalData[topLeftOffset + 2];
  const topRightB = originalData[topRightOffset + 2];
  const bottomLeftB = originalData[bottomLeftOffset + 2];
  const bottomRightB = originalData[bottomRightOffset + 2];
  
  const topB = topLeftB + (topRightB - topLeftB) * xWeight;
  const bottomB = bottomLeftB + (bottomRightB - bottomLeftB) * xWeight;
  outputData[index + 2] = topB + (bottomB - topB) * yWeight;
  
  // Alpha channel
  outputData[index + 3] = originalData[topLeftOffset + 3];
}

// Process a single row of pixels
function processRow(
  y: number,
  width: number,
  height: number,
  originalData: Uint8ClampedArray,
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
): void {
  // Pre-calculate row offset for performance
  const rowOffset = y * width;
  
  for (let x = 0; x < width; x++) {
    // Calculate normalized position relative to face center
    const normX = (x - centerX) / halfFaceWidth;
    const normY = (y - centerY) / halfFaceHeight;
    const distFromCenter = Math.sqrt(normX * normX + normY * normY);
    
    // Skip if outside approximate face area (fast path)
    if (distFromCenter > maxInfluenceDistance) {
      // Copy original pixel for areas outside face
      const i = (rowOffset + x) * 4;
      for (let c = 0; c < 4; c++) {
        outputData[i + c] = originalData[i + c];
      }
      continue;
    }
    
    // Calculate displacement based on facial features
    let displacementX = 0;
    let displacementY = 0;
    
    // Eye region
    if (normY < -0.15 && normY > -0.65 && Math.abs(normX) > 0.1 && Math.abs(normX) < 0.45) {
      // Apply eye size transformation
      displacementX += (sliderValues.eyeSize / 50) * normX * amplificationFactor;
      displacementY += (sliderValues.eyeSize / 50) * normY * amplificationFactor;
      
      // Apply eye spacing transformation
      displacementX += (sliderValues.eyeSpacing / 50) * (normX > 0 ? 1 : -1) * amplificationFactor;
    }
    
    // Eyebrow region
    if (normY < -0.25 && normY > -0.75 && Math.abs(normX) > 0.05 && Math.abs(normX) < 0.5) {
      displacementY -= (sliderValues.eyebrowHeight / 50) * amplificationFactor;
    }
    
    // Nose region
    if (Math.abs(normX) < 0.25 && normY > -0.4 && normY < 0.25) {
      displacementX += (sliderValues.noseWidth / 50) * normX * amplificationFactor;
      displacementY += (sliderValues.noseLength / 50) * (normY > 0 ? 1 : -1) * amplificationFactor;
    }
    
    // Mouth region
    if (Math.abs(normX) < 0.35 && normY > 0.05 && normY < 0.45) {
      displacementX += (sliderValues.mouthWidth / 50) * normX * amplificationFactor;
      displacementY += (sliderValues.mouthHeight / 50) * (normY - 0.25) * amplificationFactor;
    }
    
    // Overall face width
    if (distFromCenter > 0.4 && distFromCenter < 1.1) {
      displacementX += (sliderValues.faceWidth / 50) * normX * amplificationFactor;
    }
    
    // Chin shape
    if (normY > 0.35 && Math.abs(normX) < 0.35) {
      displacementY += (sliderValues.chinShape / 50) * (normY - 0.4) * amplificationFactor;
    }
    
    // Jawline
    if (normY > 0.15 && Math.abs(normX) > 0.25 && Math.abs(normX) < 0.65) {
      displacementX += (sliderValues.jawline / 50) * (normX > 0 ? 1 : -1) * amplificationFactor;
    }
    
    // Apply transition zone
    if (distFromCenter > innerEdge && distFromCenter < maxInfluenceDistance) {
      const smoothFadeFactor = calculateTransitionFactor(distFromCenter, innerEdge, maxInfluenceDistance);
      displacementX *= smoothFadeFactor;
      displacementY *= smoothFadeFactor;
    }
    
    // Calculate sample position with displacement
    const sampleX = x - displacementX;
    const sampleY = y - displacementY;
    
    // Pixel index calculation
    const index = (rowOffset + x) * 4;
    
    // Handle edges and apply interpolation
    if (sampleX < safetyMargin || sampleY < safetyMargin || 
        sampleX >= width - safetyMargin || sampleY >= height - safetyMargin) {
      let adjustedSampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, sampleX));
      let adjustedSampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, sampleY));
      
      bilinearInterpolation(
        originalData, 
        adjustedSampleX, 
        adjustedSampleY, 
        width, 
        height, 
        outputData, 
        index
      );
    } else {
      bilinearInterpolation(
        originalData, 
        sampleX, 
        sampleY, 
        width, 
        height, 
        outputData, 
        index
      );
    }
  }
}

// Message handler for worker commands
self.onmessage = function(e) {
  const startTime = performance.now();
  
  // Check if this is a processing request
  if (e.data.command === 'process') {
    const { originalImageData, params } = e.data;
    
    // Create output data array
    const outputData = new Uint8ClampedArray(originalImageData.data.length);
    
    // Extract processing parameters
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
    
    // Process each row
    for (let y = 0; y < originalImageData.height; y++) {
      processRow(
        y,
        originalImageData.width,
        originalImageData.height,
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
    
    // Calculate processing time
    const processingTime = performance.now() - startTime;
    
    // Transfer processed data back to main thread
    // Fix: Correct usage of postMessage with transferable objects
    const messageData = {
      processedData: outputData.buffer,
      width: originalImageData.width,
      height: originalImageData.height,
      processingTime
    };
    
    // Correctly specify transferables as the third parameter (or in options object)
    self.postMessage(messageData, [outputData.buffer]);
  }
};

// Ensure TypeScript understands the worker context
export {};
