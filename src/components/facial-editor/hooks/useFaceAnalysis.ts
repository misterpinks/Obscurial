
import { useState } from 'react';
import * as faceapi from 'face-api.js';
import { useToast } from "@/components/ui/use-toast";
import { createImageFromCanvas } from '../utils/canvasUtils';

export interface FaceDetection {
  landmarks?: any;
  detection?: any;
  confidence?: number;
  original?: any;
  modified?: any;
}

export const useFaceAnalysis = (
  isFaceApiLoaded: boolean,
  originalImage: HTMLImageElement | null,
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>
) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [facialDifference, setFacialDifference] = useState<number | null>(null);
  const [initialProcessingDone, setInitialProcessingDone] = useState(false);
  const [hasShownNoFaceToast, setHasShownNoFaceToast] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const detectFaces = async () => {
    if (!originalImage || !isFaceApiLoaded) return;
    
    try {
      setIsAnalyzing(true);
      
      // Update image dimensions when detecting faces
      setImageDimensions({
        width: originalImage.width,
        height: originalImage.height
      });
      
      // Use a lower confidence threshold (0.3 instead of 0.5) to improve face detection
      const detections = await faceapi
        .detectSingleFace(originalImage, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      setIsAnalyzing(false);
      
      if (detections) {
        console.log("Face detected with confidence:", detections.detection.score);
        setFaceDetection({
          landmarks: detections.landmarks,
          detection: detections.detection,
          confidence: detections.detection.score,
          original: detections.descriptor
        });
        
        setHasShownNoFaceToast(false);
        // Ensure the image is processed after detection completes
        setInitialProcessingDone(true);
      } else {
        console.log("No face detected in the image");
        setFaceDetection(null);
        
        if (!hasShownNoFaceToast) {
          toast({
            variant: "destructive",
            title: "No Face Detected",
            description: "Try uploading a clearer image with a face."
          });
          setHasShownNoFaceToast(true);
        }
        
        // Even if no face is detected, we should still process the image to show it
        setInitialProcessingDone(true);
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      setIsAnalyzing(false);
      setFaceDetection(null);
      
      if (!hasShownNoFaceToast) {
        toast({
          variant: "destructive",
          title: "Face Detection Error",
          description: "Could not analyze facial features."
        });
        setHasShownNoFaceToast(true);
      }
      
      // Even if face detection fails, we should still process the image to show it
      setInitialProcessingDone(true);
    }
  };

  const analyzeModifiedImage = async () => {
    if (!cleanProcessedCanvasRef.current || !isFaceApiLoaded) return;
    
    try {
      setIsAnalyzing(true);
      
      const processedImage = await createImageFromCanvas(cleanProcessedCanvasRef.current);
      
      // Use the same lower confidence threshold for consistency
      const detections = await faceapi
        .detectSingleFace(processedImage, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (detections && faceDetection) {
        // Update state with modified face descriptor
        setFaceDetection(prev => ({
          ...prev!,
          modified: detections.descriptor
        }));
        
        // Calculate similarity between original and modified faces
        if (faceDetection.original) {
          // Improved facial difference calculation
          // The euclideanDistance typically returns values between 0-1 for similar faces
          // and larger values for different faces. We need to enhance this difference
          // to better reflect visual changes
          const distance = faceapi.euclideanDistance(
            faceDetection.original, 
            detections.descriptor
          );
          
          // Apply a non-linear transformation to emphasize differences
          // This will make small changes more noticeable in the score
          const enhancedDistance = Math.pow(distance * 4, 1.5);
          const clampedDistance = Math.min(enhancedDistance, 2.0);
          
          console.log("Raw facial difference:", distance);
          console.log("Enhanced facial difference:", clampedDistance);
          setFacialDifference(clampedDistance);
        }
      } else {
        console.log("No face detected in modified image - this is good for anti-recognition");
        // If no face is detected in the modified image, that's actually good for defeating recognition
        setFacialDifference(2.0); // Maximum difference - recognition fully defeated
        toast({
          title: "Recognition Defeated",
          description: "The face is no longer detectable by AI - excellent privacy protection!"
        });
      }

      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing modified image:", error);
      setIsAnalyzing(false);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Could not analyze facial differences."
      });
    }
  };

  return { 
    isAnalyzing, 
    faceDetection, 
    facialDifference, 
    initialProcessingDone, 
    detectFaces, 
    analyzeModifiedImage,
    setInitialProcessingDone,
    setFaceDetection,
    imageDimensions,
    setHasShownNoFaceToast
  };
};
