
/**
 * Worker Manager
 * Handles communication with Web Workers and provides a fallback for browsers that don't support them
 */

// Check if Web Workers are supported in the current environment
export const isWorkerSupported = typeof Worker !== 'undefined';

// Create a new worker from a given URL
export const createWorker = (workerUrl: string): Worker | undefined => {
  if (!isWorkerSupported) {
    console.warn('Web Workers are not supported in this browser. Falling back to main thread processing.');
    return undefined;
  }
  
  try {
    // For Vite bundling, we need to use new URL() and import.meta.url pattern
    // This ensures the worker is properly bundled by Vite
    const resolvedWorkerUrl = new URL(workerUrl, import.meta.url).href;
    const worker = new Worker(resolvedWorkerUrl, { type: 'classic' });
    console.log('Web worker created successfully');
    
    // Add error handler
    worker.addEventListener('error', (error) => {
      console.error('Web worker error:', error);
    });
    
    return worker;
  } catch (error) {
    console.error('Failed to create Web Worker:', error);
    return undefined;
  }
};

// Helper to create a blob URL from a worker function
export const createWorkerBlobUrl = (workerFunction: Function): string => {
  // Convert the function to a string and wrap it in an IIFE
  const functionStr = `(${workerFunction.toString()})();`;
  
  // Create a blob from the function string
  const blob = new Blob([functionStr], { type: 'application/javascript' });
  
  // Create a URL for the blob
  return URL.createObjectURL(blob);
};

// Define TypeScript type for Web Worker scope
// This helps avoid the DedicatedWorkerGlobalScope error
export interface WorkerGlobalScopeInterface extends EventTarget {
  self: WorkerGlobalScopeInterface;
  postMessage: (message: any, transfer?: Transferable[]) => void;
  onmessage: ((this: WorkerGlobalScopeInterface, ev: MessageEvent) => any) | null;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => void;
}

// Process image data using a worker with a timeout
export const processImageWithWorker = async (
  worker: Worker | undefined,
  imageData: ImageData,
  params: any,
  timeoutMs: number = 5000
): Promise<ImageData> => {
  // If worker is not available, fall back to synchronous processing
  if (!worker) {
    throw new Error('Worker not available, use fallback processing');
  }
  
  return new Promise<ImageData>((resolve, reject) => {
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      worker.removeEventListener('message', messageHandler);
      reject(new Error('Worker processing timed out'));
    }, timeoutMs);
    
    // Handle message from worker
    const messageHandler = (event: MessageEvent) => {
      clearTimeout(timeoutId);
      
      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }
      
      // If we received processed data
      if (event.data.processedData) {
        const { processedData, width, height, processingTime } = event.data;
        
        console.log(`Worker processed image in ${processingTime.toFixed(2)}ms`);
        
        // Create a new ImageData object from the processed data
        try {
          const result = new ImageData(
            new Uint8ClampedArray(processedData),
            width,
            height
          );
          
          resolve(result);
        } catch (error) {
          console.error('Error creating ImageData from worker result:', error);
          reject(error);
        }
      } else if (event.data.status === 'ready') {
        console.log('[DEBUG-useImageProcessingCore] Image processing worker ready');
        // Just a ready message, don't resolve/reject
      } else {
        reject(new Error('Invalid response from worker'));
      }
    };
    
    // Listen for messages from the worker
    worker.addEventListener('message', messageHandler);
    
    // Send data to worker for processing
    worker.postMessage({
      command: 'process',
      originalImageData: {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height
      },
      params
    });
  });
};

// Clean up worker resources
export const terminateWorker = (worker: Worker | undefined): void => {
  if (worker) {
    worker.terminate();
  }
};

// Fallback function when web workers aren't supported
export const processImageInMainThread = (
  imageData: ImageData,
  params: any
): ImageData => {
  const width = imageData.width;
  const height = imageData.height;
  
  // Create a copy of the source data
  const resultData = new Uint8ClampedArray(imageData.data);
  
  // Apply simple noise (a minimal implementation)
  if (params.noiseLevel && params.noiseLevel > 0) {
    const noiseLevel = params.noiseLevel;
    for (let i = 0; i < resultData.length; i += 4) {
      // Apply to RGB but not alpha
      for (let j = 0; j < 3; j++) {
        const noise = (Math.random() - 0.5) * noiseLevel * 2;
        resultData[i + j] = Math.min(255, Math.max(0, resultData[i + j] + noise));
      }
    }
  }
  
  return new ImageData(resultData, width, height);
};
