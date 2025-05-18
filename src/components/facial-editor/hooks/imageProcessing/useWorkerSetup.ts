
import { useRef, useState, useEffect } from 'react';
import { createWorker, terminateWorker, isWorkerSupported } from '../../utils/workers/workerManager';

export const useWorkerSetup = () => {
  const workerRef = useRef<Worker | undefined>(undefined);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  
  // Initialize the web worker once
  useEffect(() => {
    if (workerRef.current) {
      return; // Worker already initialized
    }
    
    console.log("[DEBUG-useImageProcessingCore] Setting up web worker");
    if (isWorkerSupported) {
      try {
        // Create worker from the worker file URL
        const workerUrl = new URL('../../utils/workers/imageProcessingWorker.ts', import.meta.url);
        const worker = createWorker(workerUrl.href);
        
        if (worker) {
          // Listen for the ready message
          const readyHandler = (event: MessageEvent) => {
            if (event.data?.status === 'ready') {
              console.log('[DEBUG-useImageProcessingCore] Image processing worker ready');
              setIsWorkerReady(true);
            }
          };
          
          worker.addEventListener('message', readyHandler);
          workerRef.current = worker;
          
          return () => {
            worker.removeEventListener('message', readyHandler);
            terminateWorker(worker);
            workerRef.current = undefined;
            console.log('[DEBUG-useImageProcessingCore] Worker terminated on cleanup');
          };
        }
      } catch (error) {
        console.error('[DEBUG-useImageProcessingCore] Failed to initialize worker:', error);
      }
    } else {
      console.log('[DEBUG-useImageProcessingCore] Web Workers not supported, using main thread processing');
    }
  }, []); // Empty dependency array to run only once
  
  return {
    worker: workerRef.current,
    isWorkerReady
  };
};
