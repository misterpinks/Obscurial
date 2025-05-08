
import { useCallback, useEffect, useState, RefObject } from 'react';
import { FaceEffectOptions } from '../utils/transformationTypes';
import { applyFeatureTransformations } from '../utils/transformationEngine';
import { useLandmarksDrawing } from './imageProcessing/useLandmarks';

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
  const [imageDrawnToOriginalCanvas, setImageDrawnToOriginalCanvas] = useState(false);
  
  // Use the landmarks drawing hook
  const { drawFaceLandmarks } = useLandmarksDrawing({
    faceDetection,
    processedCanvasRef,
    originalImage
  });

  // Preserve original image on canvas whenever it changes
  useEffect(() => {
    if (!originalImage) {
      console.log('No original image available to draw to canvas');
      setImageDrawnToOriginalCanvas(false);
      return;
    }
    
    if (!originalCanvasRef.current) {
      console.log('Original canvas reference not available');
      return;
    }
    
    console.log('Drawing original image to canvas:', originalImage.width, 'x', originalImage.height);
    
    const origCtx = originalCanvasRef.current.getContext("2d");
    if (!origCtx) {
      console.error('Failed to get canvas context for original image');
      return;
    }
    
    // Wait for the image to be fully loaded
    const drawImage = () => {
      try {
        // Set canvas dimensions to match image
        originalCanvasRef.current!.width = originalImage.width;
        originalCanvasRef.current!.height = originalImage.height;
        
        // Clear any previous content
        origCtx.clearRect(0, 0, originalImage.width, originalImage.height);
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
        
        console.log("Original image successfully drawn to canvas");
        setImageDrawnToOriginalCanvas(true);
        
        // Once the original image is drawn, initiate face detection
        if (isFaceApiLoaded) {
          console.log("Triggering face detection after drawing image to canvas");
          detectFaces();
        }
      } catch (error) {
        console.error("Error drawing original image to canvas:", error);
      }
    };
    
    if (originalImage.complete) {
      drawImage();
    } else {
      originalImage.onload = drawImage;
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, detectFaces]);

  // Process image when sliders change or when initial processing is done
  useEffect(() => {
    // Only proceed if we have an image and initial processing is complete
    if (!originalImage || !initialProcessingDone) {
      console.log('Skipping processing - missing image or initial processing not done');
      return;
    }
    
    // Only process if values actually changed or we haven't processed yet
    const currentValuesString = JSON.stringify({ sliders: sliderValues, effects: faceEffectOptions });
    if (lastProcessedValues && currentValuesString === lastProcessedValues) {
      console.log('Skipping processing - values have not changed');
      return;
    }
    
    console.log('Processing image due to slider/effect value changes or initial loading');
    processImage();
  }, [sliderValues, faceEffectOptions, initialProcessingDone, originalImage, lastProcessedValues]);
  
  // Redraw landmarks when showLandmarks changes
  useEffect(() => {
    if (!originalImage || !initialProcessingDone || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) {
      console.log('Cannot redraw landmarks - missing prerequisites');
      return;
    }
    
    // Just redraw from the clean canvas instead of full reprocessing
    const processedCtx = processedCanvasRef.current.getContext('2d');
    if (!processedCtx || !cleanProcessedCanvasRef.current) {
      console.error("Failed to get processed canvas context for redrawing landmarks");
      return;
    }
    
    try {
      console.log(`Redrawing canvas with landmarks ${showLandmarks ? 'enabled' : 'disabled'}`);
      processedCtx.clearRect(0, 0, processedCanvasRef.current.width, processedCanvasRef.current.height);
      processedCtx.drawImage(cleanProcessedCanvasRef.current, 0, 0);
      
      // If landmarks should be shown, draw them
      if (showLandmarks && faceDetection) {
        drawFaceLandmarks();
      }
    } catch (error) {
      console.error("Error redrawing landmarks:", error);
    }
  }, [showLandmarks, faceDetection, originalImage, initialProcessingDone, drawFaceLandmarks]);

  // Process the image and apply transformations
  const processImage = useCallback(async () => {
    if (!originalImage) {
      console.log('Missing original image for processing');
      return;
    }
    
    if (!processedCanvasRef.current || !cleanProcessedCanvasRef.current) {
      console.log('Missing canvas references for processing');
      return;
    }
    
    setIsProcessing(true);
    console.log('Starting image processing with worker status:', isWorkerReady ? 'worker available' : 'using main thread');
    
    try {
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
      try {
        const dataURL = cleanCanvas.toDataURL("image/png");
        setCleanProcessedImageURL(dataURL);
        console.log('Clean canvas processed and URL updated');
      } catch (e) {
        console.error("Failed to generate data URL from clean canvas:", e);
      }
      
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
        drawFaceLandmarks();
      }
      
      // Store last processed values to prevent unnecessary reprocessing
      const currentValuesString = JSON.stringify({ sliders: sliderValues, effects: faceEffectOptions });
      setLastProcessedValues(currentValuesString);
      
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
    isWorkerReady,
    drawFaceLandmarks
  ]);

  // Helper function to download the processed image
  const downloadImage = useCallback(() => {
    if (!cleanProcessedImageURL) {
      console.log("No processed image available to download");
      return;
    }
    
    console.log("Downloading processed image");
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
