
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
  const [lastProcessedValues, setLastProcessedValues] = useState<string>('');
  
  // Use the extracted face detection hook
  const {
    isAnalyzing: isDetecting,
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
    facialTelemetryDelta,
    analyzeModifiedImage: baseAnalyzeModifiedImage,
    isAnalyzing: isAnalyzingModified
  } = useModifiedFaceAnalysis(
    isFaceApiLoaded,
    cleanProcessedCanvasRef,
    faceDetection,
    setFaceDetection
  );

  // Wrap the analysis function to prevent automatic triggering
  const analyzeModifiedImage = useCallback(async () => {
    console.log('Manual analysis triggered');
    try {
      await baseAnalyzeModifiedImage();
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not complete facial analysis. Please try again."
      });
    }
  }, [baseAnalyzeModifiedImage, toast]);

  // Combine both analyzing states
  const isAnalyzing = isDetecting || isAnalyzingModified;

  // Toggle auto-analyze feature
  const toggleAutoAnalyze = useCallback(() => {
    setAutoAnalyze(prev => !prev);
  }, []);

  return { 
    isAnalyzing, 
    faceDetection, 
    facialDifference,
    facialTelemetryDelta,
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
