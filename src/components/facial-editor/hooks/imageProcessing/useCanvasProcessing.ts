
import { useCallback } from 'react';
import { applyFeatureTransformations } from '../../utils/transformationEngine';

interface UseCanvasProcessingProps {
  originalImage: HTMLImageElement | null;
  processedCanvasRef: React.RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetection: any;
  sliderValues: Record<string, number>;
  showLandmarks: boolean;
  drawFaceLandmarks: () => void;
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  };
}

export const useCanvasProcessing = ({
  originalImage,
  processedCanvasRef,
  cleanProcessedCanvasRef,
  faceDetection,
  sliderValues,
  showLandmarks,
  drawFaceLandmarks,
  faceEffectOptions
}: UseCanvasProcessingProps) => {

  // Process an image, applying transformations and optionally face effects
  const processImage = useCallback(() => {
    if (!originalImage || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) return;
    
    console.log("Starting image processing");
    
    try {
      // First process the clean canvas (without landmarks)
      const cleanCanvas = cleanProcessedCanvasRef.current;
      const cleanCtx = cleanCanvas.getContext("2d", { willReadFrequently: true });
      if (!cleanCtx) return;
      
      // Set canvas dimensions to match image
      cleanCanvas.width = originalImage.width;
      cleanCanvas.height = originalImage.height;
      
      // Clear the canvas first to ensure no remnants of previous images
      cleanCtx.clearRect(0, 0, cleanCanvas.width, cleanCanvas.height);
      
      // Apply feature transformations directly to the clean canvas
      applyFeatureTransformations({
        ctx: cleanCtx,
        originalImage,
        width: cleanCanvas.width,
        height: cleanCanvas.height,
        faceDetection,
        sliderValues,
        faceEffectOptions
      });
      
      // Now process the canvas with landmarks
      const canvas = processedCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Set canvas dimensions to match image
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      
      // Clear the canvas first to ensure no remnants of previous images
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Copy the clean processed image to the display canvas
      ctx.drawImage(cleanCanvas, 0, 0);
      
      // Draw landmarks on top of the processed image
      if (faceDetection && showLandmarks) {
        // We need to ensure this happens after the image is drawn
        drawFaceLandmarks();
      }
      
      // Return the processed canvas for potential further usage
      return cleanCanvas;
    } catch (error) {
      console.error("Error processing image:", error);
      return null;
    }
  }, [
    originalImage, 
    processedCanvasRef, 
    cleanProcessedCanvasRef, 
    faceDetection, 
    sliderValues, 
    showLandmarks,
    drawFaceLandmarks,
    faceEffectOptions
  ]);

  return { processImage };
};
