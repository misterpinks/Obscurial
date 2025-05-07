
import { useCallback } from 'react';
import { applyFeatureTransformations } from '../../utils/transformationEngine';
import { useLandmarksDrawing } from './useLandmarks';

interface UseCanvasProcessingProps {
  originalImage: HTMLImageElement | null;
  processedCanvasRef: React.RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetection: any;
  sliderValues: Record<string, number>;
  showLandmarks: boolean;
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage: HTMLImageElement | null;
    maskPosition: { x: number; y: number };
    maskScale: number;
  };
}

export const useCanvasProcessing = ({
  originalImage,
  processedCanvasRef,
  cleanProcessedCanvasRef,
  faceDetection,
  sliderValues,
  showLandmarks,
  faceEffectOptions
}: UseCanvasProcessingProps) => {
  // Use the landmarks drawing hook
  const { drawFaceLandmarks } = useLandmarksDrawing({
    faceDetection,
    processedCanvasRef,
    originalImage
  });

  // Process an image, applying transformations and optionally face effects
  const processImage = useCallback(() => {
    if (!originalImage || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) return;
    
    // First process the clean canvas (without landmarks)
    const cleanCanvas = cleanProcessedCanvasRef.current;
    const cleanCtx = cleanCanvas.getContext("2d");
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
    
    // Copy the clean processed image to the display canvas
    ctx.drawImage(cleanCanvas, 0, 0);
    
    // Draw landmarks on top of the processed image if enabled
    if (faceDetection && showLandmarks) {
      drawFaceLandmarks();
    }
    
    return cleanCanvas.toDataURL("image/png");
  }, [originalImage, processedCanvasRef, cleanProcessedCanvasRef, faceDetection, sliderValues, showLandmarks, faceEffectOptions, drawFaceLandmarks]);

  return { processImage };
};
