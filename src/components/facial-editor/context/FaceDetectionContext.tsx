
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { FaceDetection } from '../hooks/types';

interface FaceDetectionContextType {
  isAnalyzing: boolean;
  faceDetection: FaceDetection | null;
  setFaceDetection: (detection: FaceDetection | null) => void;
  detectFaces: (image: HTMLImageElement) => Promise<void>;
  imageDimensions: { width: number; height: number };
  hasShownNoFaceToast: boolean;
  setHasShownNoFaceToast: (value: boolean) => void;
  detectionAttempts: number;
}

const FaceDetectionContext = createContext<FaceDetectionContextType | null>(null);

export const useFaceDetectionContext = () => {
  const context = useContext(FaceDetectionContext);
  if (!context) {
    throw new Error('useFaceDetectionContext must be used within a FaceDetectionProvider');
  }
  return context;
};

interface FaceDetectionProviderProps {
  children: React.ReactNode;
  isFaceApiLoaded: boolean;
  toast: any;
}

export const FaceDetectionProvider: React.FC<FaceDetectionProviderProps> = ({ 
  children, 
  isFaceApiLoaded, 
  toast 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [detectionAttempts, setDetectionAttempts] = useState(0);
  const [hasShownNoFaceToast, setHasShownNoFaceToast] = useState(false);
  
  // Use a ref to prevent unnecessary detection calls
  const detectionInProgressRef = useRef(false);
  const attemptCountRef = useRef(0);

  // Reset detection state when the component unmounts
  useEffect(() => {
    return () => {
      detectionInProgressRef.current = false;
      attemptCountRef.current = 0;
    };
  }, []);

  // Use a more sensitive detection option with a lower threshold
  const getDetectionOptions = useCallback(() => {
    return new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.1 });
  }, []);

  // Helper function to handle when no face is detected
  const handleNoFaceDetection = useCallback(() => {
    setFaceDetection(null);
    
    if (!hasShownNoFaceToast) {
      toast({
        variant: "default",
        title: "Processing without face detection",
        description: "No face detected. Applying global adjustments."
      });
      setHasShownNoFaceToast(true);
    }
    
    setDetectionAttempts(0);
    attemptCountRef.current = 0;
  }, [hasShownNoFaceToast, toast]);
  
  // Helper function to handle detection failure
  const handleDetectionFailure = useCallback(() => {
    setFaceDetection(null);
    
    if (!hasShownNoFaceToast) {
      toast({
        variant: "destructive",
        title: "Face Detection Error",
        description: "Could not analyze facial features."
      });
      setHasShownNoFaceToast(true);
    }
    
    setDetectionAttempts(0);
    attemptCountRef.current = 0;
  }, [hasShownNoFaceToast, toast]);

  const detectFaces = useCallback(async (originalImage: HTMLImageElement) => {
    // Don't attempt detection if API isn't loaded or already in progress
    if (!isFaceApiLoaded || detectionInProgressRef.current || !originalImage) {
      console.log("Skipping face detection:", {
        apiLoaded: isFaceApiLoaded,
        inProgress: detectionInProgressRef.current,
        hasImage: !!originalImage
      });
      return;
    }
    
    try {
      detectionInProgressRef.current = true;
      setIsAnalyzing(true);
      console.log("Starting face detection attempt:", attemptCountRef.current + 1);
      
      // Log the image dimensions to help with debugging
      console.log("Image dimensions:", originalImage.width, "x", originalImage.height);
      
      // Update image dimensions when detecting faces
      setImageDimensions({
        width: originalImage.width,
        height: originalImage.height
      });
      
      // Verify the image is valid and loaded
      if (originalImage.width === 0 || originalImage.height === 0) {
        console.error("Image has zero width or height, cannot detect faces");
        setIsAnalyzing(false);
        detectionInProgressRef.current = false;
        return;
      }

      // Detect faces with better options and lower threshold
      const detections = await faceapi
        .detectSingleFace(originalImage, getDetectionOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (detections) {
        console.log("Face detected with confidence:", detections.detection.score);
        
        // Store detection data
        setFaceDetection({
          landmarks: detections.landmarks,
          detection: detections.detection,
          confidence: detections.detection.score,
          original: detections.descriptor,
          modified: null // Initialize modified as null
        });
        
        // Reset attempts counter
        attemptCountRef.current = 0;
        setDetectionAttempts(0);
        setHasShownNoFaceToast(false);
      } else {
        console.log("No face detected in the image, attempt:", attemptCountRef.current + 1);
        
        // Try one more time with even lower threshold if this is the first attempt
        if (attemptCountRef.current < 2) {
          attemptCountRef.current++;
          setDetectionAttempts(prev => prev + 1);
          
          console.log("Retrying face detection with fallback method");
          
          // Try a different detector as fallback
          try {
            const fallbackDetections = await faceapi
              .detectSingleFace(originalImage, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
              .withFaceLandmarks()
              .withFaceDescriptor();
              
            if (fallbackDetections) {
              console.log("Face detected with fallback method, confidence:", fallbackDetections.detection.score);
              
              setFaceDetection({
                landmarks: fallbackDetections.landmarks,
                detection: fallbackDetections.detection,
                confidence: fallbackDetections.detection.score,
                original: fallbackDetections.descriptor,
                modified: null
              });
              
              attemptCountRef.current = 0;
              setDetectionAttempts(0);
              setHasShownNoFaceToast(false);
            } else {
              setFaceDetection(null);
              handleNoFaceDetection();
            }
          } catch (fallbackError) {
            console.error("Fallback face detection failed:", fallbackError);
            handleDetectionFailure();
          }
        } else {
          handleNoFaceDetection();
        }
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      handleDetectionFailure();
    } finally {
      setIsAnalyzing(false);
      // Set a slight delay before allowing another detection to prevent rapid re-renders
      setTimeout(() => {
        detectionInProgressRef.current = false;
      }, 500);
    }
  }, [isFaceApiLoaded, getDetectionOptions, handleNoFaceDetection, handleDetectionFailure]);

  const value = {
    isAnalyzing,
    faceDetection,
    setFaceDetection,
    detectFaces,
    imageDimensions,
    hasShownNoFaceToast,
    setHasShownNoFaceToast,
    detectionAttempts
  };

  return (
    <FaceDetectionContext.Provider value={value}>
      {children}
    </FaceDetectionContext.Provider>
  );
};
