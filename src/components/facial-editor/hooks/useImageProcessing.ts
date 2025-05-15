
import { useCallback, useEffect, useState, RefObject } from 'react';
import { FaceEffectOptions } from '../utils/transformationTypes';
import { applyFeatureTransformations } from '../utils/transformationEngine';
import { useLandmarksDrawing } from './imageProcessing/useLandmarks';

// Performance optimization constants
const PROCESSING_PRIORITY_DELAY = 0;
const LANDMARK_RENDER_DELAY = 10;

interface UseImageProcessingProps {
  originalImage: HTMLImageElement | null;
  originalCanvasRef: RefObject<HTMLCanvasElement>;
  processedCanvasRef: RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: RefObject<HTMLCanvasElement>;
  faceDetection: any;
  sliderValues: Record<string, number>;
  initialProcessingDone: boolean;
  showLandmarks: boolean;
  isFaceApiLoaded: boolean;
  detectFaces: () => void;
  analyzeModifiedImage: () => void;
  autoAnalyze: boolean;
  lastProcessedValues: string;
  setLastProcessedValues: (values: string) => void;
  faceEffectOptions: FaceEffectOptions;
  worker?: Worker;
  isWorkerReady?: boolean;
  onProcessingComplete?: () => void;
}

export const useImageProcessing = ({
  originalImage,
  originalCanvasRef,
  processedCanvasRef,
  cleanProcessedCanvasRef,
  faceDetection,
  sliderValues,
  initialProcessingDone,
  showLandmarks,
  isFaceApiLoaded,
  detectFaces,
  analyzeModifiedImage,
  autoAnalyze,
  lastProcessedValues,
  setLastProcessedValues,
  faceEffectOptions,
  worker,
  isWorkerReady = false,
  onProcessingComplete
}: UseImageProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>('');
  const [imageDrawnToOriginalCanvas, setImageDrawnToOriginalCanvas] = useState(false);
  
  // Use the landmarks drawing hook
  const { drawFaceLandmarks } = useLandmarksDrawing({
    faceDetection,
    processedCanvasRef,
    originalImage
  });

  // Preserve original image on canvas whenever it changes - Optimized with requestAnimationFrame
  useEffect(() => {
    if (!originalImage) {
      setImageDrawnToOriginalCanvas(false);
      return;
    }
    
    if (!originalCanvasRef.current) return;
    
    const drawImage = () => {
      requestAnimationFrame(() => {
        const origCtx = originalCanvasRef.current?.getContext("2d");
        if (!origCtx) return;
        
        try {
          // Set canvas dimensions to match image
          originalCanvasRef.current!.width = originalImage.width;
          originalCanvasRef.current!.height = originalImage.height;
          
          // Enable better rendering for performance optimization
          origCtx.imageSmoothingEnabled = true;
          origCtx.imageSmoothingQuality = 'medium'; // Balance between quality and speed
          
          // Clear and draw the image to canvas
          origCtx.clearRect(0, 0, originalImage.width, originalImage.height);
          origCtx.drawImage(originalImage, 0, 0);
          
          setImageDrawnToOriginalCanvas(true);
          
          // Once the original image is drawn, initiate face detection
          if (isFaceApiLoaded) {
            setTimeout(detectFaces, 5); // Reduced timeout
          }
        } catch (error) {
          console.error("Error drawing original image to canvas:", error);
        }
      });
    };
    
    if (originalImage.complete) {
      drawImage();
    } else {
      originalImage.onload = drawImage;
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, detectFaces]);

  // Process image with optimizations for performance
  const processImage = useCallback(async () => {
    if (!originalImage) return;
    
    if (!processedCanvasRef.current || !cleanProcessedCanvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // Use microtask for more immediate processing start
      await Promise.resolve();
      
      // First process the clean canvas (without landmarks)
      const cleanCanvas = cleanProcessedCanvasRef.current;
      const cleanCtx = cleanCanvas.getContext('2d', { alpha: true });
      if (!cleanCtx) return;
      
      // Set canvas dimensions to match image
      cleanCanvas.width = originalImage.width;
      cleanCanvas.height = originalImage.height;
      
      // Enable better performance canvas settings
      cleanCtx.imageSmoothingEnabled = true;
      cleanCtx.imageSmoothingQuality = 'medium'; // Balance quality and speed
      
      // Apply feature transformations to the clean canvas
      // This is the most performance-intensive part
      await applyFeatureTransformations({
        ctx: cleanCtx,
        originalImage,
        width: cleanCanvas.width,
        height: cleanCanvas.height,
        faceDetection,
        sliderValues,
        faceEffectOptions,
        worker: isWorkerReady ? worker : undefined
      });
      
      // Update clean processed image URL for download
      try {
        const dataURL = cleanCanvas.toDataURL("image/png");
        setCleanProcessedImageURL(dataURL);
      } catch (e) {
        console.error("Failed to generate data URL from clean canvas:", e);
      }
      
      // Short delay before updating the display canvas to prioritize clean canvas processing
      setTimeout(() => {
        requestAnimationFrame(() => {
          // Now process the canvas with landmarks
          const canvas = processedCanvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) return;
          
          // Set canvas dimensions to match image
          canvas.width = originalImage.width;
          canvas.height = originalImage.height;
          
          // Copy the clean processed image to the display canvas
          ctx.drawImage(cleanCanvas, 0, 0);
          
          // Further delay drawing landmarks to prioritize image display
          setTimeout(() => {
            // Draw landmarks on top of the processed image if needed
            if (faceDetection && showLandmarks) {
              drawFaceLandmarks();
            }
            
            // Store last processed values to prevent unnecessary reprocessing
            const currentValuesString = JSON.stringify({ sliders: sliderValues, effects: faceEffectOptions });
            setLastProcessedValues(currentValuesString);
            
            // Notify that processing is complete
            if (onProcessingComplete) {
              onProcessingComplete();
            }
            
            setIsProcessing(false);
          }, LANDMARK_RENDER_DELAY);
        });
      }, PROCESSING_PRIORITY_DELAY);
    } catch (error) {
      console.error("Error processing image:", error);
      
      // Even if there's an error, make sure something is displayed in both canvases
      if (cleanProcessedCanvasRef.current && originalImage) {
        const fallbackCtx = cleanProcessedCanvasRef.current.getContext('2d');
        if (fallbackCtx) {
          fallbackCtx.clearRect(0, 0, cleanProcessedCanvasRef.current.width, cleanProcessedCanvasRef.current.height);
          fallbackCtx.drawImage(originalImage, 0, 0);
        }
      }
      
      if (processedCanvasRef.current && originalImage) {
        const fallbackCtx = processedCanvasRef.current.getContext('2d');
        if (fallbackCtx) {
          fallbackCtx.clearRect(0, 0, processedCanvasRef.current.width, processedCanvasRef.current.height);
          fallbackCtx.drawImage(originalImage, 0, 0);
        }
      }
      
      setIsProcessing(false);
    }
  }, [
    originalImage, 
    faceDetection, 
    sliderValues, 
    showLandmarks, 
    isFaceApiLoaded,
    analyzeModifiedImage,
    autoAnalyze,
    setLastProcessedValues,
    faceEffectOptions,
    worker,
    isWorkerReady,
    drawFaceLandmarks,
    onProcessingComplete
  ]);
  
  // Helper function to download the processed image
  const downloadImage = useCallback(() => {
    if (!cleanProcessedImageURL) return;
    
    const link = document.createElement("a");
    link.href = cleanProcessedImageURL;
    link.download = "privacy-protected-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [cleanProcessedImageURL]);

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    downloadImage,
    imageDrawnToOriginalCanvas
  };
};

// Export the face mirroring function so it can be used in transformationEngine
export const mirrorFace = (ctx: CanvasRenderingContext2D, width: number, height: number, rightToLeft: boolean) => {
  // Create temporary canvas to hold the original image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Copy the current canvas state to temp canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Clear the main canvas
  ctx.clearRect(0, 0, width, height);
  
  // Calculate the center line
  const centerX = width / 2;
  
  // Draw the original half
  if (rightToLeft) {
    // Mirror right side to left side
    ctx.drawImage(tempCanvas, centerX, 0, centerX, height, centerX, 0, centerX, height);
    
    // Draw the right half mirrored to the left side
    ctx.save();
    ctx.translate(centerX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(tempCanvas, centerX, 0, centerX, height, 0, 0, centerX, height);
    ctx.restore();
  } else {
    // Mirror left side to right side
    ctx.drawImage(tempCanvas, 0, 0, centerX, height, 0, 0, centerX, height);
    
    // Draw the left half mirrored to the right side
    ctx.save();
    ctx.translate(centerX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(tempCanvas, 0, 0, centerX, height, 0, 0, centerX, height);
    ctx.restore();
  }
};
