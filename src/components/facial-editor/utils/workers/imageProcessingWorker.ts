
// This file runs in a Web Worker context

// Send a ready message back to the main thread
self.postMessage({ status: 'ready' });

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  // Process based on message type
  switch (type) {
    case 'processPixels':
      const result = processPixels(data);
      self.postMessage({ type: 'pixelsProcessed', data: result });
      break;
    
    case 'process':
      const startTime = performance.now();
      
      if (event.data.originalImageData) {
        const processedData = processImageData(
          event.data.originalImageData.data,
          event.data.originalImageData.width,
          event.data.originalImageData.height,
          event.data.params || {}
        );
        
        const processingTime = performance.now() - startTime;
        
        // Send the processed data back to the main thread
        self.postMessage({
          processedData: processedData,
          width: event.data.originalImageData.width,
          height: event.data.originalImageData.height,
          processingTime: processingTime
        });
      } else {
        self.postMessage({ error: 'No image data provided' });
      }
      break;
      
    default:
      console.error('Unknown message type:', type);
      self.postMessage({ type: 'error', message: `Unknown message type: ${type}` });
  }
});

// Process image pixels (sample function)
function processPixels(data) {
  const { imageData, params } = data;
  
  // Return processed data
  return {
    processed: true,
    // Add additional processing results here
  };
}

// Process image data with transformations
function processImageData(data, width, height, params) {
  // Create a copy of the image data to avoid mutating the original
  const processedData = new Uint8ClampedArray(data);
  
  // Apply specified transformations based on params
  // Just a simple noise function for now
  if (params.noiseLevel && params.noiseLevel > 0) {
    applyNoise(processedData, params.noiseLevel);
  }
  
  return processedData;
}

// Apply noise to image data
function applyNoise(data, level) {
  const noiseStrength = Math.min(Math.max(level, 0), 50);
  
  for (let i = 0; i < data.length; i += 4) {
    // Skip alpha channel
    for (let c = 0; c < 3; c++) {
      const noise = (Math.random() - 0.5) * noiseStrength;
      data[i + c] = Math.min(255, Math.max(0, data[i + c] + noise));
    }
  }
}

// Web workers don't use ES modules, so we don't need export {}
