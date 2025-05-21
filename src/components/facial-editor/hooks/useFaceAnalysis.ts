
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useFaceDetection } from './useFaceDetection';
import { useModifiedFaceAnalysis } from './useModifiedFaceAnalysis';
import { FaceDetection } from './types';
import { useFaceDetectionContext } from '../context/FaceDetectionContext';

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
  // Use a ref to track if the hook has been initialized
  const hasInitialized = useRef(false);
  
  const internalToastHook = useToast();
  const toast = externalToast || internalToastHook.toast;
  
  const [initialProcessingDone, setInitialProcessingDone] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [lastProcessedValues, setLastProcessedValues] = useState<string>('');
  const [analysisAttempts, setAnalysisAttempts] = useState(0);
  const [analysisState, setAnalysisState] = useState<'idle' | 'detecting' | 'analyzing'>('idle');
  
  // Add console log only during first initialization
  if (!hasInitialized.current) {
    console.log("[DEBUG-useFaceAnalysis] Initializing hook, autoAnalyze:", autoAnalyze);
    hasInitialized.current = true;
  }
  
  // Check if we're using the context API
  const faceDetectionContext = useFaceDetectionContext();
  const {
    isAnalyzing,
    faceDetection,
    setFaceDetection,
    detectFaces,
    imageDimensions,
    hasShownNoFaceToast,
    setHasShownNoFaceToast,
    detectionAttempts
  } = useFaceDetection(
    originalImage,
    initialProcessingDone,
    setInitialProcessingDone
  );

  // Use the extracted modified face analysis hook
  const {
    facialDifference,
    analyzeModifiedImage: originalAnalyzeModifiedImage,
    requestAutoAnalysis,
    isAnalyzing: isAnalyzingModified
  } = useModifiedFaceAnalysis(
    isFaceApiLoaded,
    cleanProcessedCanvasRef,
    faceDetection,
    setFaceDetection,
    toast
  );
  
  // Wrap analyzeModifiedImage to add state management
  const analyzeModifiedImage = useCallback(() => {
    // Only allow analysis if we're not already analyzing
    if (analysisState !== 'idle') {
      console.log("[DEBUG-useFaceAnalysis] Analysis already in progress, skipping");
      return;
    }
    
    // Set state to analyzing
    setAnalysisState('analyzing');
    
    // Call the original function
    originalAnalyzeModifiedImage();
    
    // Set a timeout to reset the state after a while
    setTimeout(() => {
      setAnalysisState('idle');
    }, 5000);
  }, [analysisState, originalAnalyzeModifiedImage]);
  
  // Only log when analysis attempts change, not on every render
  useEffect(() => {
    console.log("[DEBUG-useFaceAnalysis] Analysis attempts updated:", analysisAttempts);
    if (analysisAttempts > 2) {
      setAnalysisAttempts(0);
      setAutoAnalyze(false); // Turn off auto analyze when we hit the limit
      
      toast({
        title: "Analysis paused",
        description: "Too many attempts. Auto-analysis has been turned off."
      });
    }
  }, [analysisAttempts, toast]);
  
  // Toggle autoAnalyze with proper memoization
  const toggleAutoAnalyze = useCallback(() => {
    setAutoAnalyze(prev => !prev);
  }, []);
  
  // Processing complete callback with proper memoization and state tracking
  const onProcessingComplete = useCallback(() => {
    // Implement strict rate limiting for processing callback
    if (autoAnalyze && analysisState === 'idle') {
      requestAutoAnalysis();
      setAnalysisAttempts(prev => prev + 1);
    }
  }, [autoAnalyze, requestAutoAnalysis, analysisState]);

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
