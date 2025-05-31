
import { useState, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { useToast } from "@/components/ui/use-toast";
import { createImageFromCanvas } from '../utils/canvasUtils';
import { FaceDetection } from './types';

export const useFaceDetection = (
  isFaceApiLoaded: boolean,
  originalImage: HTMLImageElement | null,
  setInitialProcessingDone: (value: boolean) => void,
  setHasShownNoFaceToast: (value: boolean) => void,
  hasShownNoFaceToast: boolean
) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [detectionAttempts, setDetectionAttempts] = useState(0);
  
  // Track which image we've already processed to prevent loops
  const processedImageRef = useRef<HTMLImageElement | null>(null);
  const isDetectingRef = useRef(false);

  // Use a more sensitive detection option with a lower threshold
  const detectionOptions = () => {
    return new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.1 });
  };

  const detectFaces = useCallback(async () => {
    if (!originalImage || !isFaceApiLoaded) {
      console.log("Cannot detect faces: missing image or face API not loaded");
      return;
    }
    
    // Prevent multiple simultaneous detections
    if (isDetectingRef.current) {
      console.log("Face detection already in progress, skipping");
      return;
    }

    // Only prevent reprocessing if it's the exact same image AND we've already successfully processed it
    if (originalImage === processedImageRef.current && faceDetection) {
      console.log("Face detection already completed for this image, skipping");
      return;
    }
    
    try {
      isDetectingRef.current = true;
      setIsAnalyzing(true);
      console.log("Starting face detection attempt:", detectionAttempts + 1);
      
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
        setInitialProcessingDone(true);
        return;
      }

      // Detect faces with better options and lower threshold
      const detections = await faceapi
        .detectSingleFace(originalImage, detectionOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (detections) {
        console.log("Face detected with confidence:", detections.detection.score);
        
        // Store detection data
        setFaceDetection({
          landmarks: detections.landmarks,
          detection: detections.detection,
          confidence: detections.detection.score,
          original: detections.descriptor
        });
        
        // Reset attempts counter and mark as processed
        setDetectionAttempts(0);
        setHasShownNoFaceToast(false);
        processedImageRef.current = originalImage;
        setInitialProcessingDone(true);
      } else {
        console.log("No face detected in the image");
        handleDetectionFailure();
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      handleDetectionFailure();
    } finally {
      setIsAnalyzing(false);
      isDetectingRef.current = false;
    }
  }, [originalImage, isFaceApiLoaded, detectionAttempts, hasShownNoFaceToast, setInitialProcessingDone, setHasShownNoFaceToast, faceDetection]);
  
  // Helper function to handle detection failure
  const handleDetectionFailure = () => {
    setFaceDetection(null);
    
    if (!hasShownNoFaceToast) {
      toast({
        variant: "destructive",
        title: "Face Detection Error",
        description: "Could not analyze facial features."
      });
      setHasShownNoFaceToast(true);
    }
    
    processedImageRef.current = originalImage;
    setInitialProcessingDone(true);
    setDetectionAttempts(0);
  };

  return {
    isAnalyzing,
    faceDetection,
    setFaceDetection,
    detectFaces,
    imageDimensions,
    detectionAttempts
  };
};
