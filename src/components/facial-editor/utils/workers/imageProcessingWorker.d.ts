
// Type definitions for imageProcessingWorker
// This helps TypeScript understand the worker without requiring ES module syntax

interface ProcessingData {
  imageData: ImageData;
  params: any;
}

interface ProcessedResult {
  processed: boolean;
  [key: string]: any;
}

interface ImageDataMessage {
  command: 'process';
  originalImageData: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  };
  params?: any;
}

interface ProcessResponse {
  processedData: Uint8ClampedArray;
  width: number;
  height: number;
  processingTime: number;
}

// Note: This is just for TypeScript - it doesn't actually get used in the worker
// Workers use standard DOM APIs, not ES modules
