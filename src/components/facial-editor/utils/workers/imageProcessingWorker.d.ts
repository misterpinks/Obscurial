
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

export {};
