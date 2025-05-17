
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
  const autoAnalyzeCooldownRef = useRef(false);
  const initializedRef = useRef(false);
  
  console.log("[DEBUG-useFaceAnalysis] Initializing hook, autoAnalyze:", autoAnalyze);
  
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
  
  // Set initialization flag to prevent re-initialization loops
  useEffect(() => {
    initializedRef.current = true;
    
    // Cleanup function
    return () => {
      initializedRef.current = false;
    };
  }, []);
  
  // Prevent infinite analysis loops - removed dependencies to avoid re-triggering
  useEffect(() => {
    console.log("[DEBUG-useFaceAnalysis] Analysis attempts updated:", analysisAttempts);
    if (analysisAttempts > 2) {
      console.log("[DEBUG-useFaceAnalysis] Too many analysis attempts, stopping automatic analysis");
      setAnalysisAttempts(0);
      analysisInProgressRef.current = false;
      setAutoAnalyze(false); // Turn off auto analyze when we hit the limit
      
      toast({
        title: "Analysis paused",
        description: "Too many attempts. Auto-analysis has been turned off."
      });
      
      // Add a longer cooldown period
      autoAnalyzeCooldownRef.current = true;
      setTimeout(() => {
        autoAnalyzeCooldownRef.current = false;
        console.log("[DEBUG-useFaceAnalysis] Auto-analyze cooldown period ended");
      }, 5000);
    }
  }, [analysisAttempts, toast]);
  
  // When auto-analyze changes, trigger an analysis if enabled
  const toggleAutoAnalyze = useCallback(() => {
    const newValue = !autoAnalyze;
    console.log("[DEBUG-useFaceAnalysis] Auto-analyze toggled to:", newValue);
    setAutoAnalyze(newValue);
    
    // If turning on auto-analyze, trigger an analysis
    if (newValue && faceDetection && !analysisInProgressRef.current && !autoAnalyzeCooldownRef.current) {
      // Implement rate limiting - only analyze if enough time has passed
      const now = Date.now();
      if (now - lastAnalysisTime > 3000) { // 3 seconds between analyses (increased)
        console.log("[DEBUG-useFaceAnalysis] Triggering initial analysis after toggle");
        analysisInProgressRef.current = true;
        setLastAnalysisTime(now);
        requestAutoAnalysis();
        setAnalysisAttempts(prev => prev + 1);
        
        // Reset flag after a delay
        setTimeout(() => {
          analysisInProgressRef.current = false;
          console.log("[DEBUG-useFaceAnalysis] Analysis in progress flag reset");
        }, 3000); // Longer delay to prevent rapid cycling
      } else {
        console.log("[DEBUG-useFaceAnalysis] Analysis attempted too soon, waiting");
      }
    }
  }, [autoAnalyze, faceDetection, requestAutoAnalysis, lastAnalysisTime]);
  
  // This is called whenever an image is processed
  const onProcessingComplete = useCallback(() => {
    console.log("[DEBUG-useFaceAnalysis] Processing complete callback invoked", {
      autoAnalyze,
      analysisInProgress: analysisInProgressRef.current,
      callbackInvoked: processingCallbackInvokedRef.current,
      cooldown: autoAnalyzeCooldownRef.current
    });
    
    // Implement strict rate limiting for processing callback
    if (processingCallbackInvokedRef.current) {
      console.log("[DEBUG-useFaceAnalysis] Processing callback already invoked recently, skipping");
      return;
    }
    
    if (autoAnalyze && !analysisInProgressRef.current && !autoAnalyzeCooldownRef.current) {
      const now = Date.now();
      if (now - lastAnalysisTime > 3000) { // 3 second minimum between analyses (increased)
        console.log("[DEBUG-useFaceAnalysis] Auto-analyzing after processing complete");
        processingCallbackInvokedRef.current = true;
        analysisInProgressRef.current = true;
        setLastAnalysisTime(now);
        requestAutoAnalysis();
        setAnalysisAttempts(prev => prev + 1);
        
        // Reset flags after a delay
        setTimeout(() => {
          analysisInProgressRef.current = false;
          processingCallbackInvokedRef.current = false;
          console.log("[DEBUG-useFaceAnalysis] Analysis flags reset after processing");
        }, 3500); // Longer delay to prevent rapid cycling
      } else {
        console.log("[DEBUG-useFaceAnalysis] Analysis attempted too soon after previous analysis, waiting");
      }
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
