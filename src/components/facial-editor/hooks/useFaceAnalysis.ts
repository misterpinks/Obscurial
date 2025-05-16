
import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [analysisAttempts, setAnalysisAttempts] = useState(0);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  
  // Add reference to prevent analysis loops
  const analysisInProgressRef = useRef(false);
  const processingCallbackInvokedRef = useRef(false);
  
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
  
  // Prevent infinite analysis loops
  useEffect(() => {
    if (analysisAttempts > 3) {
      console.log("Too many analysis attempts, stopping automatic analysis");
      setAnalysisAttempts(0);
      analysisInProgressRef.current = false;
      setAutoAnalyze(false); // Turn off auto analyze when we hit the limit
      
      toast({
        title: "Analysis paused",
        description: "Too many attempts. Auto-analysis has been turned off."
      });
    }
  }, [analysisAttempts, toast]);
  
  // When auto-analyze changes, trigger an analysis if enabled
  const toggleAutoAnalyze = useCallback(() => {
    const newValue = !autoAnalyze;
    setAutoAnalyze(newValue);
    
    // If turning on auto-analyze, trigger an analysis
    if (newValue && faceDetection && !analysisInProgressRef.current) {
      // Implement rate limiting - only analyze if enough time has passed
      const now = Date.now();
      if (now - lastAnalysisTime > 2000) { // 2 seconds between analyses
        analysisInProgressRef.current = true;
        setLastAnalysisTime(now);
        requestAutoAnalysis();
        setAnalysisAttempts(prev => prev + 1);
        
        // Reset flag after a delay
        setTimeout(() => {
          analysisInProgressRef.current = false;
        }, 2000); // Longer delay to prevent rapid cycling
      }
    }
  }, [autoAnalyze, faceDetection, requestAutoAnalysis, lastAnalysisTime]);
  
  // This is called whenever an image is processed
  const onProcessingComplete = useCallback(() => {
    // Implement strict rate limiting for processing callback
    if (processingCallbackInvokedRef.current) {
      console.log("Processing callback already invoked recently, skipping");
      return;
    }
    
    if (autoAnalyze && !analysisInProgressRef.current) {
      const now = Date.now();
      if (now - lastAnalysisTime > 2000) { // 2 second minimum between analyses
        processingCallbackInvokedRef.current = true;
        analysisInProgressRef.current = true;
        setLastAnalysisTime(now);
        requestAutoAnalysis();
        setAnalysisAttempts(prev => prev + 1);
        
        // Reset flags after a delay
        setTimeout(() => {
          analysisInProgressRef.current = false;
          processingCallbackInvokedRef.current = false;
        }, 2500); // Longer delay to prevent rapid cycling
      } else {
        console.log("Analysis attempted too soon after previous analysis, waiting");
      }
    }
  }, [autoAnalyze, requestAutoAnalysis, lastAnalysisTime]);

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
