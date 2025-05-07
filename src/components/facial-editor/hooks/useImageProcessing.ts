
import { useState, useCallback, useEffect } from 'react';
import { useCanvasProcessing } from './imageProcessing/useCanvasProcessing';
import { useImageDownload } from './imageProcessing/useImageDownload';

interface UseImageProcessingProps {
  originalImage: HTMLImageElement | null;
  originalCanvasRef: React.RefObject<HTMLCanvasElement>;
  processedCanvasRef: React.RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetection: any;
  sliderValues: Record<string, number>;
  initialProcessingDone: boolean;
  showLandmarks: boolean;
  isFaceApiLoaded: boolean;
  detectFaces: () => void;
  analyzeModifiedImage: () => void;
  autoAnalyze: boolean;
  lastProcessedValues: Record<string, number> | null;
  setLastProcessedValues: React.Dispatch<React.SetStateAction<Record<string, number> | null>>;
  faceEffectOptions?: any;
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
  faceEffectOptions
}: UseImageProcessingProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>('');
  const [processedImageURL, setProcessedImageURL] = useState<string>('');

  // Use the canvas processing hook
  const { processImage } = useCanvasProcessing({
    originalImage,
    processedCanvasRef,
    cleanProcessedCanvasRef,
    faceDetection,
    sliderValues,
    showLandmarks,
    faceEffectOptions
  });

  // Use the image download hook
  const { downloadImage } = useImageDownload(cleanProcessedImageURL);

  // Display the original image when it's loaded
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext('2d');
      if (origCtx) {
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
      }
    }
  }, [originalImage, originalCanvasRef]);

  // Process the image when needed
  const processImageWithState = useCallback(() => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    
    try {
      // Process the image and get the clean data URL
      const dataURL = processImage();
      
      if (dataURL) {
        setCleanProcessedImageURL(dataURL);
        
        // If we have face data and auto-analyze is enabled, analyze the modified image
        if (faceDetection && isFaceApiLoaded && autoAnalyze) {
          setTimeout(analyzeModifiedImage, 300);
        }
        
        // Save the slider values that were used for processing
        setLastProcessedValues({...sliderValues});
      }
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, processImage, faceDetection, isFaceApiLoaded, autoAnalyze, analyzeModifiedImage, sliderValues, setLastProcessedValues]);

  // Process the image whenever original image changes or slider values change
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Check if we actually need to process
      const needsProcessing = !lastProcessedValues || 
        Object.keys(sliderValues).some(key => sliderValues[key] !== lastProcessedValues[key]);
      
      if (needsProcessing) {
        processImageWithState();
      }
    }
  }, [originalImage, initialProcessingDone, sliderValues, lastProcessedValues, processImageWithState]);

  // Initially detect faces
  useEffect(() => {
    if (isFaceApiLoaded && originalImage && !initialProcessingDone) {
      detectFaces();
    }
  }, [isFaceApiLoaded, originalImage, initialProcessingDone, detectFaces]);

  return {
    isProcessing,
    cleanProcessedImageURL,
    processedImageURL,
    processImage: processImageWithState,
    downloadImage
  };
};
