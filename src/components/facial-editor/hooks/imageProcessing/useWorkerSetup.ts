
import { useState, useEffect, useRef } from 'react';

export const useWorkerSetup = () => {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const workerInitializedRef = useRef(false);
  const messageHandlerSetRef = useRef(false);

  useEffect(() => {
    // Don't recreate the worker if it already exists
    if (workerInitializedRef.current) {
      return;
    }
    
    // Mark as initialized to prevent duplication
    workerInitializedRef.current = true;
    
    // Check if the Worker API is available
    if (typeof Worker === 'undefined') {
      console.log('Web Workers are not supported in this environment');
      return;
    }

    try {
      // Create worker
      console.log('Creating web worker for image processing...');
      
      // Create a new worker
      const worker = new Worker(new URL('../../utils/workers/imageProcessingWorker.ts', import.meta.url), { type: 'module' });
      
      // Set up message handler only once
      if (!messageHandlerSetRef.current) {
        messageHandlerSetRef.current = true;
        
        // Set up message handler
        worker.onmessage = (event) => {
          if (event.data.status === 'ready') {
            console.log('Image processing worker ready');
            setIsWorkerReady(true);
          }
        };
        
        // Set up error handler
        worker.onerror = (error) => {
          console.error('Error in image processing worker:', error);
          setIsWorkerReady(false);
        };
      }
      
      // Initialize the worker
      worker.postMessage('init');
      
      // Store the worker in the ref
      workerRef.current = worker;
      
      // Clean up the worker when component unmounts
      return () => {
        console.log('Terminating image processing worker');
        worker.terminate();
        setIsWorkerReady(false);
        workerRef.current = null;
        messageHandlerSetRef.current = false;
        workerInitializedRef.current = false;
      };
    } catch (error) {
      console.error('Failed to create image processing worker:', error);
      setIsWorkerReady(false);
      messageHandlerSetRef.current = false;
      workerInitializedRef.current = false;
    }
  }, []);

  return {
    worker: workerRef.current,
    isWorkerReady
  };
};
