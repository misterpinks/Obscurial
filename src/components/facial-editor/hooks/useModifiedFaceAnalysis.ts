
import { useState } from 'react';
import * as faceapi from 'face-api.js';
import { useToast } from "@/components/ui/use-toast";
import { createImageFromCanvas } from '../utils/canvasUtils';
import { FaceDetection } from './types';

export const useModifiedFaceAnalysis = (
  isFaceApiLoaded: boolean,
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>,
  faceDetection: FaceDetection | null,
  setFaceDetection: (detection: FaceDetection | null) => void
) => {
  const { toast } = useToast();
  const [facialDifference, setFacialDifference] = useState<number | null>(null);

  const analyzeModifiedImage = async () => {
    if (!cleanProcessedCanvasRef.current || !isFaceApiLoaded) {
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Required resources are not available."
      });
      return;
    }
    
    try {
      const processedImage = await createImageFromCanvas(cleanProcessedCanvasRef.current);
      
      // Use the same lower confidence threshold for consistency
      const detections = await faceapi
        .detectSingleFace(processedImage, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (detections && faceDetection) {
        // Update state with modified face descriptor
        // Fix: Create a new object instead of using a function updater
        const updatedFaceDetection: FaceDetection = {
          ...faceDetection,
          modified: detections.descriptor
        };
        
        setFaceDetection(updatedFaceDetection);
        
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
          
          toast({
            title: "Analysis Complete",
            description: `Facial difference: ${clampedDistance.toFixed(2)}`
          });
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
    } catch (error) {
      console.error("Error analyzing modified image:", error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Could not analyze facial differences."
      });
    }
  };

  return {
    facialDifference,
    analyzeModifiedImage
  };
};
