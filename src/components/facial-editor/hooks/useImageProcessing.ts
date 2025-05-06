
import { useState, useEffect, RefObject, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { createImageFromCanvas } from '../utils/canvasUtils';
import { applyFeatureTransformations } from '../utils/transformationEngine';
import { drawFaceLandmarks } from '../utils/landmarkVisualization';

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
  detectFaces: () => Promise<void>;
  analyzeModifiedImage: () => Promise<void>;
  autoAnalyze: boolean;
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
  autoAnalyze
}: UseImageProcessingProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageURL, setProcessedImageURL] = useState<string>("");
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>("");
  const [processingTimeout, setProcessingTimeout] = useState<number | null>(null);
  const [lastProcessedValues, setLastProcessedValues] = useState<string>("");
  const [hasImage, setHasImage] = useState<boolean>(false);

  // Display the original image immediately after loading
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext("2d", { alpha: false });
      if (origCtx) {
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Draw the image to canvas
        origCtx.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height);
        origCtx.drawImage(originalImage, 0, 0);
        console.log("Drawing original image to canvas", originalImage.width, originalImage.height);
        setHasImage(true);
      }
      
      // After displaying original image, proceed with initial processing
      if (isFaceApiLoaded) {
        detectFaces();
      }
    }
  }, [originalImage, detectFaces, isFaceApiLoaded]);
  
  // Effect to run analysis when needed based on autoAnalyze setting
  useEffect(() => {
    // Skip if auto-analyze is off or we're already analyzing
    if (!autoAnalyze || !faceDetection || !initialProcessingDone) return;
    
    // Create a hash of the current slider values
    const currentValuesHash = JSON.stringify(sliderValues);
    
    // Only run analysis if values have changed significantly
    if (currentValuesHash !== lastProcessedValues) {
      // Use a debounce to avoid analyzing on every tiny change
      const timeoutId = window.setTimeout(() => {
        analyzeModifiedImage();
        setLastProcessedValues(currentValuesHash);
      }, 500);
      
      return () => window.clearTimeout(timeoutId);
    }
  }, [sliderValues, autoAnalyze, faceDetection, initialProcessingDone, analyzeModifiedImage, lastProcessedValues]);
  
  // Process the image with debouncing to prevent excessive re-renders
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Clear any pending processing
      if (processingTimeout !== null) {
        window.clearTimeout(processingTimeout);
      }
      
      // Debounce processing by 150ms to avoid excessive re-renders during slider dragging
      const timeoutId = window.setTimeout(() => {
        processImage();
      }, 150);
      
      setProcessingTimeout(timeoutId);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (processingTimeout !== null) {
        window.clearTimeout(processingTimeout);
      }
    };
  }, [sliderValues, originalImage, initialProcessingDone, showLandmarks]);

  const processImage = useCallback(() => {
    if (!originalImage || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) return;
    
    setIsProcessing(true);
    
    // Use requestAnimationFrame to ensure smoother UI
    requestAnimationFrame(() => {
      // First process the clean canvas (without landmarks)
      const cleanCanvas = cleanProcessedCanvasRef.current;
      const cleanCtx = cleanCanvas?.getContext("2d", { alpha: true });
      if (!cleanCtx) return;
      
      // Set canvas dimensions to match image
      cleanCanvas.width = originalImage.width;
      cleanCanvas.height = originalImage.height;
      
      // Apply feature transformations to the clean canvas
      applyFeatureTransformations({
        ctx: cleanCtx,
        originalImage, 
        width: cleanCanvas.width, 
        height: cleanCanvas.height, 
        faceDetection, 
        sliderValues
      });
      
      // We'll generate this URL only when downloading now
      
      // Now process the canvas with landmarks
      const canvas = processedCanvasRef.current;
      const ctx = canvas?.getContext("2d", { alpha: true });
      if (!ctx) return;
      
      // Set canvas dimensions to match image
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      
      // Copy the clean processed image to the display canvas
      ctx.drawImage(cleanCanvas, 0, 0);
      
      // Draw landmarks on top of the processed image if showLandmarks is true
      if (faceDetection && showLandmarks) {
        drawFaceLandmarks(canvas, faceDetection, originalImage);
      }
      
      setIsProcessing(false);
      
      // Make sure we consider this a processed image even without the URL
      setCleanProcessedImageURL("ready-for-download");
    });
  }, [originalImage, processedCanvasRef, cleanProcessedCanvasRef, faceDetection, sliderValues, showLandmarks]);

  // Generate image URL only when needed for download
  const prepareForDownload = useCallback(() => {
    if (cleanProcessedCanvasRef.current) {
      const dataUrl = cleanProcessedCanvasRef.current.toDataURL("image/png");
      setCleanProcessedImageURL(dataUrl);
      return dataUrl;
    }
    return null;
  }, [cleanProcessedCanvasRef]);

  const downloadImage = async () => {
    // Only prepare for download if we actually need to
    const dataUrl = prepareForDownload();
    if (!dataUrl) return;
    
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "privacy-protected-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Image Downloaded",
      description: "Your privacy-protected image has been saved."
    });
  };

  return {
    isProcessing,
    processedImageURL,
    cleanProcessedImageURL: hasImage ? "ready-for-download" : "",
    processImage,
    downloadImage
  };
};
