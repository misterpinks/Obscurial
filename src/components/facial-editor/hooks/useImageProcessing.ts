
import { useCallback, useEffect, useState, RefObject } from 'react';
import { FaceEffectOptions } from '../utils/transformationTypes';

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
  worker?: Worker; // Add worker parameter
  isWorkerReady?: boolean; // Add worker ready state
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
  isWorkerReady = false
}: UseImageProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>('');

  // Preserve original image on canvas whenever it changes
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
      }
    }
  }, [originalImage]);

  // Process image when sliders change or when initial processing is done
  useEffect(() => {
    if (
      originalImage && 
      initialProcessingDone && 
      sliderValues && 
      // Only process if values actually changed or we haven't processed yet
      (!lastProcessedValues || 
       JSON.stringify(sliderValues) !== lastProcessedValues)
    ) {
      console.log('Processing image due to slider value changes');
      processImage();
    }
  }, [sliderValues, initialProcessingDone, originalImage, lastProcessedValues]);
  
  // Redraw landmarks when showLandmarks changes
  useEffect(() => {
    if (originalImage && initialProcessingDone && processedCanvasRef.current && cleanProcessedCanvasRef.current) {
      // Just redraw from the clean canvas instead of full reprocessing
      const processedCtx = processedCanvasRef.current.getContext('2d');
      if (processedCtx && cleanProcessedCanvasRef.current) {
        processedCtx.clearRect(0, 0, processedCanvasRef.current.width, processedCanvasRef.current.height);
        processedCtx.drawImage(cleanProcessedCanvasRef.current, 0, 0);
        
        // If landmarks should be shown, draw them
        if (showLandmarks && faceDetection) {
          // Import and use the drawFaceLandmarks function
          const { drawFaceLandmarks } = require('../utils/landmarkVisualization');
          drawFaceLandmarks(processedCtx, faceDetection, processedCanvasRef.current.height);
        }
      }
    }
  }, [showLandmarks, faceDetection, originalImage, initialProcessingDone]);

  const processImage = useCallback(async () => {
    if (!originalImage || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) {
      console.log('Missing required elements for image processing');
      return;
    }
    
    setIsProcessing(true);
    console.log('Starting image processing with worker status:', isWorkerReady ? 'worker available' : 'using main thread');
    
    try {
      // Import the transformationEngine module
      const { applyFeatureTransformations } = require('../utils/transformationEngine');
      
      // First process the clean canvas (without landmarks)
      const cleanCanvas = cleanProcessedCanvasRef.current;
      const cleanCtx = cleanCanvas.getContext('2d');
      if (!cleanCtx) {
        console.error("Could not get clean canvas context");
        return;
      }
      
      // Set canvas dimensions to match image
      cleanCanvas.width = originalImage.width;
      cleanCanvas.height = originalImage.height;
      
      // First draw the original image to the clean canvas
      cleanCtx.drawImage(originalImage, 0, 0);
      
      // Apply feature transformations to the clean canvas
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
      setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
      console.log('Clean canvas processed and URL updated');
      
      // Now process the canvas with landmarks
      const canvas = processedCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Could not get processed canvas context");
        return;
      }
      
      // Set canvas dimensions to match image
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      
      // Copy the clean processed image to the display canvas
      ctx.drawImage(cleanCanvas, 0, 0);
      
      // Draw landmarks on top of the processed image
      if (faceDetection && showLandmarks) {
        const { drawFaceLandmarks } = require('../utils/landmarkVisualization');
        drawFaceLandmarks(ctx, faceDetection, canvas.height);
      }
      
      // Store last processed values to prevent unnecessary reprocessing
      setLastProcessedValues(JSON.stringify(sliderValues));
      
      // If we have face data and auto analyze is on, analyze the modified image
      if (faceDetection && isFaceApiLoaded && autoAnalyze) {
        setTimeout(analyzeModifiedImage, 300);
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsProcessing(false);
      console.log('Image processing complete');
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
    isWorkerReady
  ]);

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
    downloadImage
  };
};
