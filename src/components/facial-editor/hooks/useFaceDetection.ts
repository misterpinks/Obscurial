
import { useState } from 'react';
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

  // Use a more sensitive detection option with a MUCH lower threshold to catch more faces
  const detectionOptions = () => {
    // Reduce threshold further to 0.1 for better face detection
    return new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.1 });
  };

  const detectFaces = async () => {
    if (!originalImage || !isFaceApiLoaded) {
      console.log("Cannot detect faces: missing image or face API not loaded");
      return;
    }
    
    try {
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
        setIsAnalyzing(false);
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
        
        // Reset attempts counter
        setDetectionAttempts(0);
        setHasShownNoFaceToast(false);
        setInitialProcessingDone(true);
      } else {
        console.log("No face detected in the image");
        
        // Try one more time with even lower threshold if this is the first attempt
        if (detectionAttempts < 2) {
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
                original: fallbackDetections.descriptor
              });
              
              setHasShownNoFaceToast(false);
              setInitialProcessingDone(true);
              setDetectionAttempts(0);
            } else {
              setFaceDetection(null);
              
              if (!hasShownNoFaceToast) {
                toast({
                  variant: "destructive",
                  title: "No Face Detected",
                  description: "Try uploading a clearer image with a face."
                });
                setHasShownNoFaceToast(true);
              }
              
              setInitialProcessingDone(true);
            }
          } catch (fallbackError) {
            console.error("Fallback face detection failed:", fallbackError);
            handleDetectionFailure();
          }
        } else {
          handleDetectionFailure();
        }
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      handleDetectionFailure();
    } finally {
      setIsAnalyzing(false);
    }
  };
  
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
