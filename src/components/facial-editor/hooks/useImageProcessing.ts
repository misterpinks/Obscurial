
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

  // Draw original image to canvas
  useEffect(() => {
    if (!originalImage || !originalCanvasRef.current) {
      setImageDrawnToOriginalCanvas(false);
      return;
    }
    
    console.log("Drawing original image to canvas");
    const origCtx = originalCanvasRef.current.getContext("2d");
    if (!origCtx) return;
    
    try {
      // Set canvas dimensions to match image
      originalCanvasRef.current.width = originalImage.width;
      originalCanvasRef.current.height = originalImage.height;
      
      // Clear and draw the image to canvas
      origCtx.clearRect(0, 0, originalImage.width, originalImage.height);
      origCtx.drawImage(originalImage, 0, 0);
      
      setImageDrawnToOriginalCanvas(true);
      console.log("Original image drawn successfully");
      
      // Trigger face detection after image is drawn
      if (isFaceApiLoaded && !faceDetection) {
        setTimeout(detectFaces, 100);
      }
    } catch (error) {
      console.error("Error drawing original image to canvas:", error);
    }
  }, [originalImage, originalCanvasRef, isFaceApiLoaded, detectFaces, faceDetection]);

  // Process image with simplified approach
  const processImage = useCallback(async () => {
    if (!originalImage || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) {
      console.log("Missing required elements for processing");
      return;
    }
    
    console.log("Starting image processing");
    setIsProcessing(true);
    
    try {
      // Process the clean canvas first (without landmarks)
      const cleanCanvas = cleanProcessedCanvasRef.current;
      const cleanCtx = cleanCanvas.getContext('2d');
      if (!cleanCtx) {
        console.error("Could not get clean canvas context");
        return;
      }
      
      // Set canvas dimensions to match image
      cleanCanvas.width = originalImage.width;
      cleanCanvas.height = originalImage.height;
      
      console.log("Applying transformations to clean canvas");
      
      // Apply feature transformations to the clean canvas
      applyFeatureTransformations({
        ctx: cleanCtx,
        originalImage,
        width: cleanCanvas.width,
        height: cleanCanvas.height,
        faceDetection,
        sliderValues,
        faceEffectOptions
      });
      
      // Generate data URL for download
      try {
        const dataURL = cleanCanvas.toDataURL("image/png");
        setCleanProcessedImageURL(dataURL);
        console.log("Generated clean processed image URL");
      } catch (e) {
        console.error("Failed to generate data URL:", e);
      }
      
      // Now process the display canvas (with landmarks)
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
      console.log("Copied processed image to display canvas");
      
      // Draw landmarks on top if needed
      if (faceDetection && showLandmarks) {
        console.log("Drawing landmarks");
        drawFaceLandmarks();
      }
      
      // Store last processed values
      const currentValuesString = JSON.stringify({ sliders: sliderValues, effects: faceEffectOptions });
      setLastProcessedValues(currentValuesString);
      
      console.log("Image processing completed successfully");
      
      // Notify completion
      if (onProcessingComplete) {
        onProcessingComplete();
      }
      
    } catch (error) {
      console.error("Error processing image:", error);
      
      // Fallback: ensure original image is displayed
      [cleanProcessedCanvasRef.current, processedCanvasRef.current].forEach(canvas => {
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            ctx.drawImage(originalImage, 0, 0);
          }
        }
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    originalImage, 
    faceDetection, 
    sliderValues, 
    showLandmarks,
    faceEffectOptions,
    drawFaceLandmarks,
    setLastProcessedValues,
    onProcessingComplete
  ]);
  
  // Download the processed image
  const downloadImage = useCallback(() => {
    if (!cleanProcessedImageURL) {
      console.log("No processed image URL available for download");
      return;
    }
    
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
