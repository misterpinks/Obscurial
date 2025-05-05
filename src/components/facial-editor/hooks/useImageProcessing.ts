
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
  detectFaces
}: UseImageProcessingProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageURL, setProcessedImageURL] = useState<string>("");
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>("");
  const [processingTimeout, setProcessingTimeout] = useState<number | null>(null);

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
      }
      
      // After displaying original image, proceed with initial processing
      if (isFaceApiLoaded) {
        detectFaces();
      }
    }
  }, [originalImage, detectFaces, isFaceApiLoaded]);
  
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
      
      // Update clean processed image URL for download - use a lower quality for faster processing
      // Only generate this when requested, not on every slider change
      // setCleanProcessedImageURL(cleanCanvas.toDataURL("image/jpeg", 0.85));
      
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
      
      // Only update processed image URL when needed - avoid creating URLs on every render
      // setProcessedImageURL(canvas.toDataURL("image/jpeg", 0.85));
      
      setIsProcessing(false);
    });
  }, [originalImage, processedCanvasRef, cleanProcessedCanvasRef, faceDetection, sliderValues, showLandmarks]);

  // Generate image URL only when needed for download
  const prepareForDownload = useCallback(() => {
    if (cleanProcessedCanvasRef.current) {
      setCleanProcessedImageURL(cleanProcessedCanvasRef.current.toDataURL("image/png"));
      return true;
    }
    return false;
  }, [cleanProcessedCanvasRef]);

  const downloadImage = async () => {
    // Generate the image URL only when downloading
    if (!prepareForDownload()) return;
    
    const link = document.createElement("a");
    link.href = cleanProcessedImageURL;
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
    cleanProcessedImageURL,
    processImage,
    downloadImage
  };
};
