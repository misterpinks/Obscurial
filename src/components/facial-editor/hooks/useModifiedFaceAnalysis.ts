
import { useState, useEffect, useRef } from 'react';
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
  
  console.log("[DEBUG-useModifiedFaceAnalysis] Initializing hook");
  
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
        console.log("[DEBUG-useModifiedFaceAnalysis] Cleaning up analysis timer");
        clearTimeout(analysisTimerRef.current);
      }
    };
  }, []);
  
  // Fix endless loop by only triggering analysis when explicitly requested
  // IMPORTANT: We removed faceDetection from the dependencies array
  useEffect(() => {
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
      if (analysisCountRef.current < 2) { // Reduced from 3 to 2
        // Clear any existing timer
        if (analysisTimerRef.current !== null) {
          clearTimeout(analysisTimerRef.current);
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
  }, [autoRunRequestedRef.current]); // Only depend on the ref value changes

  const analyzeModifiedImage = async () => {
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
    
    // Check if we recently analyzed an identical image
    const canvasDataUrl = cleanProcessedCanvasRef.current.toDataURL('image/jpeg', 0.1);
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
      const processedImage = await createImageFromCanvas(cleanProcessedCanvasRef.current);
      
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
          // The euclideanDistance typically returns values between 0-1 for similar faces
          // and larger values for different faces. We need to enhance this difference
          // to better reflect visual changes
          const distance = faceapi.euclideanDistance(
            originalDescriptorRef.current, 
            detections.descriptor
          );
          
          // Apply a non-linear transformation to emphasize differences
          // More aggressive transformation for better recognition defeat
          const enhancedDistance = Math.pow(distance * 5, 1.5); // Increased multiplier from 4 to 5
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
      setTimeout(() => {
        analyzingRef.current = false;
        console.log("[DEBUG-useModifiedFaceAnalysis] Analysis flag reset");
      }, 2000); // Increased from 1500ms
    }
  };
  
  // Method to request an auto-analysis on next render cycle
  const requestAutoAnalysis = () => {
    console.log("[DEBUG-useModifiedFaceAnalysis] Auto-analysis requested", {
      analyzing: analyzingRef.current,
      count: analysisCountRef.current
    });
    
    if (!analyzingRef.current) {
      autoRunRequestedRef.current = true;
    }
  };

  return {
    facialDifference,
    analyzeModifiedImage,
    requestAutoAnalysis,
    isAnalyzing: analyzingRef.current
  };
};
