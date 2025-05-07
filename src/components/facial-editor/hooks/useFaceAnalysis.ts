
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useFaceDetection } from './useFaceDetection';
import { useModifiedFaceAnalysis } from './useModifiedFaceAnalysis';
import { FaceDetection } from './types';

// Re-export the FaceDetection type for compatibility
export type { FaceDetection };

export const useFaceAnalysis = (
  isFaceApiLoaded: boolean,
  originalImage: HTMLImageElement | null,
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>
) => {
  const { toast } = useToast();
  const [initialProcessingDone, setInitialProcessingDone] = useState(false);
  const [hasShownNoFaceToast, setHasShownNoFaceToast] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [lastProcessedValues, setLastProcessedValues] = useState<Record<string, number> | null>(null);
  
  // Use the extracted face detection hook
  const {
    isAnalyzing,
    faceDetection,
    setFaceDetection,
    detectFaces,
    imageDimensions
  } = useFaceDetection(
    isFaceApiLoaded,
    originalImage,
    setInitialProcessingDone,
    setHasShownNoFaceToast,
    hasShownNoFaceToast
  );

  // Use the extracted modified face analysis hook
  const {
    facialDifference,
    analyzeModifiedImage
  } = useModifiedFaceAnalysis(
    isFaceApiLoaded,
    cleanProcessedCanvasRef,
    faceDetection,
    setFaceDetection
  );

  // Toggle auto-analyze feature
  const toggleAutoAnalyze = useCallback(() => {
    setAutoAnalyze(prev => !prev);
  }, []);

  return { 
    isAnalyzing, 
    faceDetection, 
    facialDifference, 
    initialProcessingDone, 
    detectFaces, 
    analyzeModifiedImage,
    setInitialProcessingDone,
    setFaceDetection,
    imageDimensions,
    hasShownNoFaceToast,
    setHasShownNoFaceToast,
    autoAnalyze,
    toggleAutoAnalyze,
    lastProcessedValues,
    setLastProcessedValues
  };
};
