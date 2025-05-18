
import { useState, useEffect, useRef } from 'react';
import { createWorker, isWorkerSupported } from '../../utils/workers/workerManager';

export const useWorkerSetup = () => {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const workerRef = useRef<Worker | undefined>(undefined);

  useEffect(() => {
    console.log('[DEBUG-useImageProcessingCore] Setting up web worker');
    
    // Only set up once
    if (workerRef.current) return;
    
    if (!isWorkerSupported) {
      console.warn('Web Workers not supported in this browser');
      return;
    }

    try {
      // Create worker with appropriate URL for Vite
      const worker = createWorker('./src/components/facial-editor/utils/workers/imageProcessingWorker.ts');
      
      if (worker) {
        // Listen for the ready message
        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.status === 'ready') {
            console.log('[DEBUG-useImageProcessingCore] Image processing worker ready');
            setIsWorkerReady(true);
          }
        };
        
        // Listen for errors
        const errorHandler = (error: ErrorEvent) => {
          console.error('Worker error:', error);
          setIsWorkerReady(false);
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
    }
  }, []);

  return { 
    worker: workerRef.current, 
    isWorkerReady 
  };
};
