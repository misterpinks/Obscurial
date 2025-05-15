
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useFaceDetection } from './useFaceDetection';
import { useModifiedFaceAnalysis } from './useModifiedFaceAnalysis';
import { FaceDetection } from './types';

// Re-export the FaceDetection type for compatibility
export type { FaceDetection };

interface UseFaceAnalysisProps {
  isFaceApiLoaded: boolean;
  originalImage: HTMLImageElement | null;
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>;
  toast?: any; // Optional toast for backward compatibility
}

export const useFaceAnalysis = ({
  isFaceApiLoaded,
  originalImage,
  cleanProcessedCanvasRef,
  toast: externalToast
}: UseFaceAnalysisProps) => {
  const internalToastHook = useToast();
  const toast = externalToast || internalToastHook.toast;
  
  const [initialProcessingDone, setInitialProcessingDone] = useState(false);
  const [hasShownNoFaceToast, setHasShownNoFaceToast] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [lastProcessedValues, setLastProcessedValues] = useState<string>('');
  
  // Use the extracted face detection hook
  const {
    isAnalyzing,
    faceDetection,
    setFaceDetection,
    detectFaces,
    imageDimensions,
    detectionAttempts
  } = useFaceDetection(
    isFaceApiLoaded,
    originalImage,
    setInitialProcessingDone,
    setHasShownNoFaceToast,
    hasShownNoFaceToast,
    toast
  );

  // Use the extracted modified face analysis hook
  const {
    facialDifference,
    analyzeModifiedImage,
    requestAutoAnalysis,
    isAnalyzing: isAnalyzingModified
  } = useModifiedFaceAnalysis(
    isFaceApiLoaded,
    cleanProcessedCanvasRef,
    faceDetection,
    setFaceDetection,
    toast
  );
  
  // When auto-analyze changes, trigger an analysis if enabled
  const toggleAutoAnalyze = useCallback(() => {
    const newValue = !autoAnalyze;
    setAutoAnalyze(newValue);
    
    // If turning on auto-analyze, trigger an analysis
    if (newValue && faceDetection) {
      requestAutoAnalysis();
    }
  }, [autoAnalyze, faceDetection, requestAutoAnalysis]);
  
  // This is called whenever an image is processed
  const onProcessingComplete = useCallback(() => {
    if (autoAnalyze) {
      requestAutoAnalysis();
    }
  }, [autoAnalyze, requestAutoAnalysis]);

  return { 
    isAnalyzing: isAnalyzing || isAnalyzingModified, 
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
    setLastProcessedValues,
    onProcessingComplete,
    detectionAttempts
  };
};
