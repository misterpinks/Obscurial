
// Web Worker for image processing
// This is a dedicated worker file that will be loaded by the browser

// Set up the worker context
self.onmessage = function(event) {
  if (event.data.command === 'process') {
    processImage(event.data);
  } else if (event.data === 'init') {
    // Respond that the worker is ready
    self.postMessage({ status: 'ready' });
  }
};

// Process the image data
function processImage(data) {
  try {
    const startTime = performance.now();
    
    // Extract the data from the message
    const { originalImageData, params } = data;
    
    // Create a typed array from the data
    const width = originalImageData.width;
    const height = originalImageData.height;
    
    // Decode the image data
    const imageData = new Uint8ClampedArray(originalImageData.data);
    
    // Process the image (apply transformations, effects, etc.)
    const processedData = processImageData(imageData, width, height, params || {});
    
    // Calculate processing time
    const processingTime = performance.now() - startTime;
    
    // Send the processed data back to the main thread
    self.postMessage({
      processedData: processedData,
      width: width,
      height: height,
      processingTime: processingTime
    }, [processedData.buffer]); // Transfer the buffer for better performance
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      error: 'Processing error: ' + (error.message || 'Unknown error')
    });
  }
}

// Image processing function - can be expanded with more sophisticated algorithms
function processImageData(data: Uint8ClampedArray, width: number, height: number, params: any = {}) {
  // Extract parameters with defaults
  const brightness = params.sliderValues?.brightness || 0;
  const contrast = params.sliderValues?.contrast || 0;
  const saturation = params.sliderValues?.saturation || 0;
  
  // Create a copy of the data to modify
  const processedData = new Uint8ClampedArray(data.length);
  
  // Apply brightness and contrast adjustments
  for (let i = 0; i < data.length; i += 4) {
    // Simple brightness adjustment
    let r = data[i] + brightness * 2.55;
    let g = data[i + 1] + brightness * 2.55;
    let b = data[i + 2] + brightness * 2.55;
    
    // Apply contrast
    if (contrast !== 0) {
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
    }
    
    // Apply saturation
    if (saturation !== 0) {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      const satFactor = 1 + saturation / 100;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);
    }
    
    // Clamp values between 0 and 255
    processedData[i] = Math.min(255, Math.max(0, r));
    processedData[i + 1] = Math.min(255, Math.max(0, g));
    processedData[i + 2] = Math.min(255, Math.max(0, b));
    processedData[i + 3] = data[i + 3]; // Alpha - keep unchanged
  }
  
  return processedData;
}
