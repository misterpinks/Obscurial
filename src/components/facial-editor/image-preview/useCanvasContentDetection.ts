
import { useState, useEffect } from 'react';

export const useCanvasContentDetection = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  originalImage: HTMLImageElement | null,
  isProcessing?: boolean,
  isAnalyzing?: boolean
) => {
  const [isShowingCanvas, setIsShowingCanvas] = useState(false);
  const [canvasCheckTimer, setCanvasCheckTimer] = useState<number | null>(null);

  // Check if the canvas has content
  useEffect(() => {
    // Clear any existing timer
    if (canvasCheckTimer !== null) {
      clearTimeout(canvasCheckTimer);
    }
    
    // Set up a new check timer
    const timerId = window.setTimeout(() => {
      checkCanvasContent();
    }, 300); // Longer delay to ensure canvas has been rendered
    
    setCanvasCheckTimer(timerId);
    
    return () => {
      if (canvasCheckTimer !== null) {
        clearTimeout(canvasCheckTimer);
      }
    };
  }, [canvasRef.current, originalImage, isProcessing, isAnalyzing]);

  const checkCanvasContent = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("Canvas ref not available");
      setIsShowingCanvas(false);
      return;
    }
    
    try {
      // First check canvas dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        console.log("Canvas has zero dimensions");
        setIsShowingCanvas(false);
        return;
      }
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.error('Could not get canvas context');
        setIsShowingCanvas(false);
        return;
      }
      
      // Optimization: only check a sample of pixels
      const sampleSize = Math.min(canvas.width, canvas.height) / 4;
      if (sampleSize <= 0) {
        setIsShowingCanvas(false);
        return;
      }
      
      try {
        // Check if the canvas has any non-transparent pixels in the center
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        
        // Get a small region around the center
        const imageData = ctx.getImageData(
          centerX - sampleSize / 2, 
          centerY - sampleSize / 2, 
          sampleSize, 
          sampleSize
        );
        
        const data = imageData.data;
        let hasContent = false;
        
        // Sample pixels (check every 10th pixel for speed)
        for (let i = 0; i < data.length; i += 40) {
          // If any pixel has alpha > 0, canvas has content
          if (data[i + 3] > 0) {
            hasContent = true;
            break;
          }
        }
        
        setIsShowingCanvas(hasContent);
        
        if (!hasContent && originalImage) {
          console.log("Canvas appears empty but originalImage exists - forcing display");
          setIsShowingCanvas(true);
        }
      } catch (e) {
        console.warn("Error checking canvas content:", e);
        // If we can't access the canvas data, assume it has content if original image exists
        setIsShowingCanvas(!!originalImage);
      }
    } catch (e) {
      console.error("Error in checkCanvasContent:", e);
      setIsShowingCanvas(!!originalImage);
    }
  };

  return { isShowingCanvas };
};
