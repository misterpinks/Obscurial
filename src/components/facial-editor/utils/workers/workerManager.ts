// Worker manager that handles the creation and management of web workers

// Define the worker global scope interface
export interface WorkerGlobalScopeInterface {
  onmessage: (event: MessageEvent) => void;
  postMessage: (message: any) => void;
  importScripts: (...urls: string[]) => void;
}

// Check if web workers are supported
export const isWorkerSupported = typeof Worker !== 'undefined';

/**
 * Creates a web worker from the given script path
 * @param scriptPath Path to the worker script
 * @returns The created worker or undefined if not supported
 */
export const createWorker = (scriptPath: string): Worker | undefined => {
  if (!isWorkerSupported) {
    console.warn('Web Workers not supported in this browser');
    return undefined;
  }
  
  try {
    // In development with Vite, use a direct blob URL for the worker
    const workerScript = `
      // Importing the worker file
      importScripts('${window.location.origin}${scriptPath}');
    `;
    
    // Create a blob URL from the script
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    // Initialize the worker
    worker.postMessage('init');
    
    // Add error handler
    worker.addEventListener('error', (error) => {
      console.error('Web worker error:', error);
    });
    
    console.log('Web worker created successfully');
    return worker;
  } catch (error) {
    console.error('Failed to create web worker:', error);
    return undefined;
  }
};

/**
 * Processes an image using a web worker
 * @param worker The worker to use for processing
 * @param imageData The image data to process
 * @param params Additional parameters for processing
 * @param timeout Optional timeout in milliseconds
 * @returns A promise that resolves with the processed image data
 */
export const processImageWithWorker = (
  worker: Worker,
  imageData: ImageData,
  params: any = {},
  timeout?: number
): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error('No worker available'));
      return;
    }

    // Set up timeout if specified
    let timeoutId: number | undefined;
    if (timeout) {
      timeoutId = window.setTimeout(() => {
        worker.removeEventListener('message', messageHandler);
        reject(new Error('Worker processing timed out'));
      }, timeout);
    }

    // Set up a one-time message handler
    const messageHandler = (event: MessageEvent) => {
      worker.removeEventListener('message', messageHandler);
      
      // Clear timeout if it was set
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        // Convert the processed data back to an ImageData object
        const processedImageData = new ImageData(
          event.data.processedData,
          event.data.width,
          event.data.height
        );
        resolve(processedImageData);
      }
    };
    
    // Listen for the response
    worker.addEventListener('message', messageHandler);
    
    // Send the image data to the worker
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

/**
 * Terminates the web worker to clean up resources
 * @param worker The worker to terminate
 */
export const terminateWorker = (worker: Worker | undefined): void => {
  if (worker) {
    worker.terminate();
  }
};
