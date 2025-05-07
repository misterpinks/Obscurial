/**
 * Image Processing Web Worker
 * 
 * This worker handles image processing tasks off the main thread,
 * improving UI responsiveness during intensive operations.
 */

// Inform the main thread that the worker is ready
self.postMessage({ status: 'ready' });

// Main message handler for worker tasks
self.onmessage = function(event) {
  try {
    const { command, originalImageData, params } = event.data;
    
    if (command === 'process') {
      const startTime = performance.now();
      
      // Process the image
      const processedData = processImage(
        originalImageData.data,
        originalImageData.width,
        originalImageData.height,
        params
      );
      
      const processingTime = performance.now() - startTime;
      
      // Return the processed data to the main thread with performance metrics
      // Use structured cloning and transferable objects for efficient transfer
      const buffer = processedData.buffer;
      self.postMessage({
        processedData,
        width: originalImageData.width,
        height: originalImageData.height,
        processingTime
      }, [buffer]);
    }
  } catch (error) {
    // Send any errors back to the main thread
    self.postMessage({
      error: error.message || 'Unknown error in worker'
    });
  }
};

/**
 * Main image processing function
 * Applies transformations to image data
 */
function processImage(
  imageData,
  width,
  height,
  params
) {
  // Create Uint8ClampedArray for output
  const outputData = new Uint8ClampedArray(imageData.length);
  
  // Extract processing parameters
  const {
    centerX = width / 2,
    centerY = height / 2,
    faceWidth = width * 0.8,
    faceHeight = height * 0.9,
    sliderValues = {},
    amplificationFactor = 3.5,
    faceEffectOptions = null
  } = params;

  // Process the image
  for (let y = 0; y < height; y++) {
    // Process each row
    processRow(
      imageData,
      outputData,
      y,
      width,
      height,
      centerX,
      centerY,
      faceWidth,
      faceHeight,
      sliderValues,
      amplificationFactor
    );
  }
  
  // Apply face effects if specified
  if (faceEffectOptions && faceEffectOptions.effectType !== 'none') {
    applyFaceEffectsInWorker(
      outputData, 
      width, 
      height, 
      faceEffectOptions
    );
  }
  
  return outputData;
}

/**
 * Process a single row of pixels
 */
function processRow(
  inputData,
  outputData,
  y,
  width,
  height,
  centerX,
  centerY,
  faceWidth,
  faceHeight,
  sliderValues,
  amplificationFactor
) {
  const maxInfluenceDistance = 2.0;

  for (let x = 0; x < width; x++) {
    // Calculate normalized position relative to face center
    const normX = (x - centerX) / (faceWidth / 2);
    const normY = (y - centerY) / (faceHeight / 2);
    const distFromCenter = Math.sqrt(normX * normX + normY * normY);
    
    // Skip if outside expanded face area
    if (distFromCenter > maxInfluenceDistance) {
      // Just copy original pixel for areas outside the face
      const i = (y * width + x) * 4;
      outputData[i] = inputData[i];
      outputData[i + 1] = inputData[i + 1];
      outputData[i + 2] = inputData[i + 2];
      outputData[i + 3] = inputData[i + 3];
      continue;
    }
    
    // Calculate displacement based on facial feature sliders
    let displacementX = 0;
    let displacementY = 0;
    
    // Calculate transition factor (smoothly reduces effect as we move away from face)
    const transitionFactor = calculateTransitionFactor(distFromCenter, maxInfluenceDistance);
    
    // Apply feature-based transformations with transition smoothing
    
    // Eye region
    if (normY < -0.05 && normY > -0.75 && Math.abs(normX) > 0.05 && Math.abs(normX) < 0.6) {
      // Eye size
      displacementX += (sliderValues.eyeSize / 100) * normX * amplificationFactor * transitionFactor;
      displacementY += (sliderValues.eyeSize / 100) * normY * amplificationFactor * transitionFactor;
      
      // Eye spacing
      displacementX += (sliderValues.eyeSpacing / 100) * (normX > 0 ? 1 : -1) * amplificationFactor * transitionFactor;
    }
    
    // Eyebrow region
    if (normY < -0.15 && normY > -0.85 && Math.abs(normX) > 0.05 && Math.abs(normX) < 0.6) {
      // Eyebrow height
      displacementY -= (sliderValues.eyebrowHeight / 100) * amplificationFactor * transitionFactor;
    }
    
    // Nose region
    if (Math.abs(normX) < 0.4 && normY > -0.5 && normY < 0.35) {
      // Nose width and length
      displacementX += (sliderValues.noseWidth / 100) * normX * amplificationFactor * transitionFactor;
      displacementY += (sliderValues.noseLength / 100) * (normY > 0 ? 1 : -1) * amplificationFactor * transitionFactor;
    }
    
    // Mouth region
    if (Math.abs(normX) < 0.45 && normY > -0.05 && normY < 0.55) {
      // Mouth width and height
      displacementX += (sliderValues.mouthWidth / 100) * normX * amplificationFactor * transitionFactor;
      displacementY += (sliderValues.mouthHeight / 100) * (normY - 0.25) * amplificationFactor * transitionFactor;
    }
    
    // Overall face width
    if (distFromCenter > 0.3 && distFromCenter < 1.8) {
      // Face width
      displacementX += (sliderValues.faceWidth / 100) * normX * amplificationFactor * transitionFactor;
    }
    
    // Chin shape
    if (normY > 0.25 && Math.abs(normX) < 0.5) {
      // Chin shape
      displacementY += (sliderValues.chinShape / 100) * (normY - 0.4) * amplificationFactor * transitionFactor;
    }
    
    // Jawline
    if (normY > 0.05 && Math.abs(normX) > 0.15 && Math.abs(normX) < 0.8) {
      // Jawline
      displacementX += (sliderValues.jawline / 100) * (normX > 0 ? 1 : -1) * amplificationFactor * transitionFactor;
    }
    
    // Calculate sample position with displacement
    const sampleX = x - displacementX;
    const sampleY = y - displacementY;
    
    // Use bilinear interpolation to sample original image
    bilinearInterpolate(
      inputData,
      outputData,
      sampleX,
      sampleY,
      x,
      y,
      width,
      height,
      sliderValues.noiseLevel || 0
    );
  }
}

/**
 * Calculate smooth transition factor for edge blending
 */
function calculateTransitionFactor(distFromCenter, maxDistance) {
  if (distFromCenter >= maxDistance) return 0;
  if (distFromCenter <= maxDistance * 0.7) return 1;
  
  // Smooth transition between 0.7 and 1.0 of max distance
  return 1 - (distFromCenter - maxDistance * 0.7) / (maxDistance * 0.3);
}

/**
 * Apply bilinear interpolation for smoother sampling
 */
function bilinearInterpolate(
  inputData,
  outputData,
  sampleX,
  sampleY,
  targetX,
  targetY,
  width,
  height,
  noiseLevel = 0
) {
  // Clamp coordinates to image bounds
  sampleX = Math.max(0, Math.min(width - 1, sampleX));
  sampleY = Math.max(0, Math.min(height - 1, sampleY));
  
  // Get integer coordinates for the four surrounding pixels
  const x1 = Math.floor(sampleX);
  const y1 = Math.floor(sampleY);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  // Calculate interpolation weights
  const xWeight = sampleX - x1;
  const yWeight = sampleY - y1;
  
  // Get target pixel index
  const targetIndex = (targetY * width + targetX) * 4;
  
  // Interpolate each color channel
  for (let c = 0; c < 3; c++) {
    const topLeft = inputData[(y1 * width + x1) * 4 + c];
    const topRight = inputData[(y1 * width + x2) * 4 + c];
    const bottomLeft = inputData[(y2 * width + x1) * 4 + c];
    const bottomRight = inputData[(y2 * width + x2) * 4 + c];
    
    // Bilinear interpolation
    const top = topLeft + (topRight - topLeft) * xWeight;
    const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight;
    let interpolated = top + (bottom - top) * yWeight;
    
    // Add noise if specified
    if (noiseLevel > 0) {
      const noise = (Math.random() - 0.5) * noiseLevel * 2.5;
      interpolated += noise;
    }
    
    // Clamp to valid color range
    outputData[targetIndex + c] = Math.min(255, Math.max(0, interpolated));
  }
  
  // Copy alpha channel as is
  outputData[targetIndex + 3] = inputData[(y1 * width + x1) * 4 + 3];
}

/**
 * Apply face effects within the worker
 */
function applyFaceEffectsInWorker(
  imageData,
  width,
  height,
  options
) {
  const { effectType, effectIntensity } = options;
  
  switch (effectType) {
    case 'blur':
      applyBlurEffect(imageData, width, height, effectIntensity);
      break;
    case 'pixelate':
      applyPixelateEffect(imageData, width, height, effectIntensity);
      break;
    // Mask effect requires DOM access, so it's handled in the main thread
    default:
      // No effect or unsupported effect
      break;
  }
}

/**
 * Apply a simple blur effect
 */
function applyBlurEffect(imageData, width, height, intensity) {
  // Simple box blur implementation
  const radius = Math.max(1, Math.floor(intensity / 10));
  const tempData = new Uint8ClampedArray(imageData);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      
      // Sample pixels in a box around the current pixel
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const index = (ny * width + nx) * 4;
            r += tempData[index];
            g += tempData[index + 1];
            b += tempData[index + 2];
            count++;
          }
        }
      }
      
      // Average the colors
      const index = (y * width + x) * 4;
      imageData[index] = r / count;
      imageData[index + 1] = g / count;
      imageData[index + 2] = b / count;
      // Alpha remains unchanged
    }
  }
}

/**
 * Apply pixelation effect
 */
function applyPixelateEffect(imageData, width, height, intensity) {
  // Calculate block size based on intensity
  const blockSize = Math.max(2, Math.floor(intensity / 5));
  const tempData = new Uint8ClampedArray(imageData);
  
  // Process each block
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Calculate average color for this block
      let r = 0, g = 0, b = 0, count = 0;
      
      // Sample pixels in the block
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx < width && ny < height) {
            const index = (ny * width + nx) * 4;
            r += tempData[index];
            g += tempData[index + 1];
            b += tempData[index + 2];
            count++;
          }
        }
      }
      
      // Get average color
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      
      // Apply average color to all pixels in the block
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx < width && ny < height) {
            const index = (ny * width + nx) * 4;
            imageData[index] = r;
            imageData[index + 1] = g;
            imageData[index + 2] = b;
            // Alpha remains unchanged
          }
        }
      }
    }
  }
}
