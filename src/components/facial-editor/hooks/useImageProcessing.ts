
import { RefObject } from 'react';
import { useLandmarksDrawing } from './imageProcessing/useLandmarks';
import { useCanvasProcessing } from './imageProcessing/useCanvasProcessing';
import { useImageDownload } from './imageProcessing/useImageDownload';
import { useImageProcessingCore } from './imageProcessing/useImageProcessingCore';
import { useImageProcessingEffects } from './imageProcessing/useImageProcessingEffects';

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
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  };
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
  // Use extracted landmark drawing functionality
  const { drawFaceLandmarks } = useLandmarksDrawing({
    faceDetection,
    processedCanvasRef,
    originalImage
  });

  // Use extracted canvas processing functionality
  const { processImage: processImageImpl } = useCanvasProcessing({
    originalImage,
    processedCanvasRef,
    cleanProcessedCanvasRef,
    faceDetection,
    sliderValues,
    showLandmarks,
    drawFaceLandmarks,
    faceEffectOptions
  });

  // Use core image processing functionality
  const {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    debouncedProcess,
    processingQueued,
    setProcessingQueued
  } = useImageProcessingCore({
    originalImage,
    initialProcessingDone,
    autoAnalyze,
    lastProcessedValues,
    setLastProcessedValues,
    processImageImpl,
    analyzeModifiedImage,
    isFaceApiLoaded,
    faceDetection
  });

  // Use extracted image download functionality
  const { downloadImage } = useImageDownload({
    cleanProcessedImageURL
  });

  // Set up effects for image processing
  useImageProcessingEffects({
    originalImage,
    originalCanvasRef,
    initialProcessingDone,
    sliderValues,
    faceEffectOptions,
    lastProcessedValues,
    setProcessingQueued,
    setLastProcessedValues,
    detectFaces,
    processImage,
    debouncedProcess,
    processingQueued,
    isFaceApiLoaded,
    faceDetection
  });

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    downloadImage
  };
};
