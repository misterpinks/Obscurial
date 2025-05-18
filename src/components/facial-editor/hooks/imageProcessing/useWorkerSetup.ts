
import { useState, useEffect, useRef } from 'react';
import { createWorker, isWorkerSupported } from '../../utils/workers/workerManager';

export const useWorkerSetup = () => {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const workerRef = useRef<Worker | undefined>(undefined);
  const errorCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    console.log('[DEBUG-useImageProcessingCore] Setting up web worker');
    
    // Only set up once
    if (workerRef.current) return;
    
    if (!isWorkerSupported) {
      console.warn('Web Workers not supported in this browser');
      return;
    }

    try {
      // Create worker with appropriate URL for the environment
      const workerPath = '/src/components/facial-editor/utils/workers/imageProcessingWorker.ts';
      const worker = createWorker(workerPath);
      
      if (worker) {
        // Listen for the ready message
        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.status === 'ready') {
            console.log('[DEBUG-useImageProcessingCore] Image processing worker ready');
            setIsWorkerReady(true);
            errorCountRef.current = 0; // Reset error count on success
          }
        };
        
        // Listen for errors
        const errorHandler = (error: ErrorEvent) => {
          console.error('Worker error:', error);
          errorCountRef.current += 1;
          
          if (errorCountRef.current < maxRetries) {
            console.log(`Retrying worker setup (attempt ${errorCountRef.current + 1} of ${maxRetries})`);
            // Wait a bit before retrying
            setTimeout(() => {
              if (worker) {
                worker.postMessage('init');
              }
            }, 1000);
          } else {
            setIsWorkerReady(false);
            console.error('Max worker retry attempts reached. Processing will continue without worker.');
          }
        };
        
        worker.addEventListener('message', messageHandler);
        worker.addEventListener('error', errorHandler);
        
        workerRef.current = worker;
        
        return () => {
          // Clean up event listeners
          worker.removeEventListener('message', messageHandler);
          worker.removeEventListener('error', errorHandler);
          
          // Terminate worker
          worker.terminate();
          workerRef.current = undefined;
          setIsWorkerReady(false);
        };
      }
    } catch (error) {
      console.error('Failed to initialize web worker:', error);
      // Continue without worker support
      setIsWorkerReady(false);
    }
  }, []);

  // Provide a safe way to use the worker, falling back to no worker if needed
  const safeWorker = isWorkerReady ? workerRef.current : undefined;

  return { 
    worker: safeWorker, 
    isWorkerReady 
  };
};
