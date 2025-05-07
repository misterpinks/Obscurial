/**
 * Web Worker for image processing operations
 * This runs in a separate thread to prevent UI blocking
 */

// Import our worker interface type
import { WorkerGlobalScopeInterface } from './workerManager';

// TypeScript: Tell TypeScript that 'self' is of type WorkerGlobalScopeInterface
// in this worker context without trying to redeclare it
const workerSelf = self as unknown as WorkerGlobalScopeInterface;

// Let main thread know worker is ready
workerSelf.postMessage({ status: 'ready' });

// Process messages from main thread
workerSelf.addEventListener('message', (event) => {
  const { command, originalImageData, params } = event.data;
  
  if (command === 'process') {
    processImageData(originalImageData, params);
  }
});

/**
 * Process image data with facial transformations
 */
function processImageData(originalImageData, params) {
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
    
    const startTime = performance.now();
    
    // Create original data Uint8ClampedArray from buffer
    const originalData = new Uint8ClampedArray(originalImageData.data);
    
    // Create output data array
    const outputData = new Uint8ClampedArray(width * height * 4);
    
    // Process each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate normalized position relative to face center
        const normX = (x - centerX) / halfFaceWidth;
        const normY = (y - centerY) / halfFaceHeight;
        const distFromCenter = Math.sqrt(normX * normX + normY * normY);
        
        // Skip if outside maximum influence area
        if (distFromCenter > maxInfluenceDistance) {
          // Just copy original pixel for areas outside influence
          const i = (y * width + x) * 4;
          outputData[i] = originalData[i];
          outputData[i + 1] = originalData[i + 1];
          outputData[i + 2] = originalData[i + 2];
          outputData[i + 3] = originalData[i + 3];
          continue;
        }
        
        // Calculate displacement based on facial feature sliders
        let displacementX = 0;
        let displacementY = 0;
        
        // Apply eye region transformations
        if (normY < -0.15 && normY > -0.65 && Math.abs(normX) > 0.1 && Math.abs(normX) < 0.45) {
          displacementX += (sliderValues.eyeSize / 50) * normX * amplificationFactor;
          displacementY += (sliderValues.eyeSize / 50) * normY * amplificationFactor;
          displacementX += (sliderValues.eyeSpacing / 50) * (normX > 0 ? 1 : -1) * amplificationFactor;
        }
        
        // Apply other facial region transformations
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
        
        // Calculate transition factor for smooth edges
        let transitionFactor = 1.0;
        if (distFromCenter > innerEdge && distFromCenter < maxInfluenceDistance) {
          transitionFactor = 1.0 - ((distFromCenter - innerEdge) / (maxInfluenceDistance - innerEdge));
        }
        
        // Apply the transition factor to the displacement
        displacementX *= transitionFactor;
        displacementY *= transitionFactor;
        
        // Calculate sample position with displacement
        const sampleX = Math.max(0, Math.min(width - 1 - safetyMargin, x - displacementX));
        const sampleY = Math.max(0, Math.min(height - 1 - safetyMargin, y - displacementY));
        
        // Use bilinear interpolation for smoother results
        const x1 = Math.floor(sampleX);
        const y1 = Math.floor(sampleY);
        const x2 = Math.min(x1 + 1, width - 1);
        const y2 = Math.min(y1 + 1, height - 1);
        
        const xWeight = sampleX - x1;
        const yWeight = sampleY - y1;
        
        const index = (y * width + x) * 4;
        
        // Bilinear interpolation for each color channel
        for (let c = 0; c < 3; c++) {
          const topLeft = originalData[(y1 * width + x1) * 4 + c];
          const topRight = originalData[(y1 * width + x2) * 4 + c];
          const bottomLeft = originalData[(y2 * width + x1) * 4 + c];
          const bottomRight = originalData[(y2 * width + x2) * 4 + c];
          
          const top = topLeft + (topRight - topLeft) * xWeight;
          const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight;
          outputData[index + c] = top + (bottom - top) * yWeight;
        }
        
        // Alpha channel stays the same
        outputData[index + 3] = originalData[(y1 * width + x1) * 4 + 3];
      }
    }
    
    const processingTime = performance.now() - startTime;
    
    // Transfer processed data back to main thread
    // Correctly use postMessage with transferable objects
    workerSelf.postMessage(
      {
        processedData: outputData.buffer,
        width: originalImageData.width,
        height: originalImageData.height,
        processingTime
      }, 
      [outputData.buffer as Transferable]
    );
  } catch (error) {
    // Report errors back to main thread
    workerSelf.postMessage({
      error: error.message || 'Unknown error in worker'
    });
  }
}
