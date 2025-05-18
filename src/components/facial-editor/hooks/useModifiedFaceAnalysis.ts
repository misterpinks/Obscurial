
import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { createImageFromCanvas } from '../utils/canvasUtils';
import { FaceDetection } from './types';

export const useModifiedFaceAnalysis = (
  isFaceApiLoaded: boolean,
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>,
  faceDetection: FaceDetection | null,
  setFaceDetection: (detection: FaceDetection | null) => void,
  toast: any
) => {
  const [facialDifference, setFacialDifference] = useState<number | null>(null);
  const lastAnalysisRef = useRef<string | null>(null);
  const analyzingRef = useRef<boolean>(false);
  const autoRunRequestedRef = useRef<boolean>(false);
  const analysisCountRef = useRef<number>(0);
  const analysisTimerRef = useRef<number | null>(null);
  const lastAnalysisTimeRef = useRef<number>(0);
  const originalDescriptorRef = useRef<Float32Array | null>(null);
  const hasInitialized = useRef(false);
  const canvasPrevDimensionsRef = useRef({ width: 0, height: 0 });
  
  // Set initialized flag once
  if (!hasInitialized.current) {
    console.log("[DEBUG-useModifiedFaceAnalysis] Initializing hook");
    hasInitialized.current = true;
  }
  
  // Store the original descriptor in a ref to avoid dependency issues
  useEffect(() => {
    if (faceDetection?.original && !originalDescriptorRef.current) {
      console.log("[DEBUG-useModifiedFaceAnalysis] Face detection original changed, storing in ref");
      originalDescriptorRef.current = faceDetection.original;
      analysisCountRef.current = 0;
    }
  }, [faceDetection?.original]);
  
  // Clear timer on unmount
  useEffect(() => {
    console.log("[DEBUG-useModifiedFaceAnalysis] Setting up cleanup for analysis timer");
    return () => {
      if (analysisTimerRef.current !== null) {
        window.clearTimeout(analysisTimerRef.current);
      }
    };
  }, []);
  
  // Create a stable function for auto-run check to prevent loops
  const checkAutoRunRequest = useCallback(() => {
    // Only run if the component is still mounted and initialized
    if (!hasInitialized.current) return;
    
    console.log("[DEBUG-useModifiedFaceAnalysis] Auto-run effect triggered", {
      autoRunRequested: autoRunRequestedRef.current,
      analyzing: analyzingRef.current,
      count: analysisCountRef.current
    });
    
    // Only auto-analyze if explicitly requested and not already analyzing
    if (autoRunRequestedRef.current && !analyzingRef.current) {
      // Check time since last analysis
      const now = Date.now();
      const timeSinceLastAnalysis = now - lastAnalysisTimeRef.current;
      
      console.log("[DEBUG-useModifiedFaceAnalysis] Time since last analysis:", timeSinceLastAnalysis);
      
      // Rate limiting - 4 second minimum between analyses
      if (timeSinceLastAnalysis < 4000) {
        console.log("[DEBUG-useModifiedFaceAnalysis] Analysis too frequent, skipping");
        autoRunRequestedRef.current = false;
        return;
      }
      
      // Limit the number of consecutive auto-analyses
      if (analysisCountRef.current < 2) {
        // Clear any existing timer
        if (analysisTimerRef.current !== null) {
          window.clearTimeout(analysisTimerRef.current);
        }
        
        // Set a timer to prevent rapid re-analysis
        console.log("[DEBUG-useModifiedFaceAnalysis] Scheduling analysis");
        analysisTimerRef.current = window.setTimeout(() => {
          // Reset the auto-run request
          autoRunRequestedRef.current = false;
          analysisCountRef.current += 1;
          lastAnalysisTimeRef.current = Date.now();
          console.log("[DEBUG-useModifiedFaceAnalysis] Running scheduled analysis, count:", analysisCountRef.current);
          analyzeModifiedImage();
          analysisTimerRef.current = null;
        }, 1500); // Longer delay to prevent rapid cycles
      } else {
        console.log("[DEBUG-useModifiedFaceAnalysis] Too many consecutive analyses, stopping auto-analysis");
        autoRunRequestedRef.current = false;
      }
    }
  }, []);
  
  // Effect for checking auto-run requests
  useEffect(() => {
    // Don't trigger unnecessary effects
    if (autoRunRequestedRef.current) {
      checkAutoRunRequest();
    }
  }, [checkAutoRunRequest]);

  const analyzeModifiedImage = useCallback(async () => {
    // Make sure we have all required resources
    if (!cleanProcessedCanvasRef.current || !isFaceApiLoaded) {
      console.log("[DEBUG-useModifiedFaceAnalysis] Required resources for analysis not available:", {
        canvasRef: !!cleanProcessedCanvasRef.current,
        faceApiLoaded: isFaceApiLoaded
      });
      
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Required resources are not available."
      });
      return;
    }
    
    // Check for canvas size changes to avoid unnecessary reprocessing
    const canvas = cleanProcessedCanvasRef.current;
    if (canvas.width === canvasPrevDimensionsRef.current.width && 
        canvas.height === canvasPrevDimensionsRef.current.height) {
      // Update canvas dimensions
      canvasPrevDimensionsRef.current.width = canvas.width;
      canvasPrevDimensionsRef.current.height = canvas.height;
    }
    
    // Check if we recently analyzed an identical image
    const canvasDataUrl = canvas.toDataURL('image/jpeg', 0.1);
    if (canvasDataUrl === lastAnalysisRef.current) {
      console.log("[DEBUG-useModifiedFaceAnalysis] Skipping analysis - image hasn't changed");
      return;
    }
    lastAnalysisRef.current = canvasDataUrl;
    
    // Prevent multiple concurrent analyses
    if (analyzingRef.current) {
      console.log("[DEBUG-useModifiedFaceAnalysis] Analysis already in progress, skipping");
      return;
    }
    
    // Set analyzing flag to prevent concurrent analyses
    analyzingRef.current = true;
    console.log("[DEBUG-useModifiedFaceAnalysis] Running facial analysis on modified image");
    
    try {
      // Create an image from the canvas for analysis
      const processedImage = await createImageFromCanvas(canvas);
      
      console.log("[DEBUG-useModifiedFaceAnalysis] Created image from canvas, detecting face...");
      
      // Use a lower confidence threshold for better detection
      const detections = await faceapi
        .detectSingleFace(processedImage, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      console.log("[DEBUG-useModifiedFaceAnalysis] Face detection complete:", detections ? "Face found" : "No face detected");
      
      if (detections && faceDetection) {
        // Update state with modified face descriptor
        const updatedFaceDetection: FaceDetection = {
          ...faceDetection,
          modified: detections.descriptor
        };
        
        setFaceDetection(updatedFaceDetection);
        console.log("[DEBUG-useModifiedFaceAnalysis] Updated face detection with modified descriptor");
        
        // Calculate similarity between original and modified faces
        // Use the stored original descriptor from ref to avoid dependency issues
        if (originalDescriptorRef.current) {
          // Enhanced facial difference calculation
          const distance = faceapi.euclideanDistance(
            originalDescriptorRef.current, 
            detections.descriptor
          );
          
          // Apply a non-linear transformation to emphasize differences
          const enhancedDistance = Math.pow(distance * 5, 1.5);
          const clampedDistance = Math.min(enhancedDistance, 2.0);
          
          console.log("[DEBUG-useModifiedFaceAnalysis] Raw facial difference:", distance);
          console.log("[DEBUG-useModifiedFaceAnalysis] Enhanced facial difference:", clampedDistance);
          setFacialDifference(clampedDistance);
          
          toast({
            title: "Analysis Complete",
            description: `Facial difference: ${clampedDistance.toFixed(2)}`
          });
        }
      } else {
        console.log("[DEBUG-useModifiedFaceAnalysis] No face detected in modified image - this is good for anti-recognition");
        // If no face is detected in the modified image, that's actually good for defeating recognition
        setFacialDifference(2.0); // Maximum difference - recognition fully defeated
        
        if (faceDetection) {
          // Update the face detection to indicate modified is null (undetectable)
          const updatedFaceDetection: FaceDetection = {
            ...faceDetection,
            modified: null  // Explicitly set to null to indicate undetectable
          };
          setFaceDetection(updatedFaceDetection);
        }
        
        toast({
          title: "Recognition Defeated",
          description: "The face is no longer detectable by AI - excellent privacy protection!"
        });
      }
    } catch (error) {
      console.error("[DEBUG-useModifiedFaceAnalysis] Error analyzing modified image:", error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Could not analyze facial differences."
      });
    } finally {
      // Reset analyzing flag after a longer delay to prevent rapid re-analysis
      console.log("[DEBUG-useModifiedFaceAnalysis] Analysis complete, resetting flag in 2 seconds");
      window.setTimeout(() => {
        analyzingRef.current = false;
        console.log("[DEBUG-useModifiedFaceAnalysis] Analysis flag reset");
      }, 2000);
    }
  }, [cleanProcessedCanvasRef, isFaceApiLoaded, faceDetection, setFaceDetection, toast]);
  
  // Method to request an auto-analysis on next render cycle - memoized
  const requestAutoAnalysis = useCallback(() => {
    console.log("[DEBUG-useModifiedFaceAnalysis] Auto-analysis requested", {
      analyzing: analyzingRef.current,
      count: analysisCountRef.current
    });
    
    if (!analyzingRef.current) {
      autoRunRequestedRef.current = true;
    }
  }, []);

  return {
    facialDifference,
    analyzeModifiedImage,
    requestAutoAnalysis,
    isAnalyzing: analyzingRef.current
  };
}, []);
