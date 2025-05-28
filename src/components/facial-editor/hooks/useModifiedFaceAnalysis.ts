
import { useState, useCallback } from 'react';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeModifiedImage = useCallback(async () => {
    if (!cleanProcessedCanvasRef.current || !isFaceApiLoaded || isAnalyzing) {
      console.log('Analysis skipped - missing requirements or already analyzing');
      return;
    }
    
    console.log('Starting modified face analysis');
    setIsAnalyzing(true);
    
    try {
      const processedImage = await createImageFromCanvas(cleanProcessedCanvasRef.current);
      
      // Use the same lower confidence threshold for consistency
      const detections = await faceapi
        .detectSingleFace(processedImage, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (detections && faceDetection) {
        // Update state with modified face descriptor
        const updatedFaceDetection: FaceDetection = {
          ...faceDetection,
          modified: detections.descriptor
        };
        
        setFaceDetection(updatedFaceDetection);
        
        // Calculate similarity between original and modified faces
        if (faceDetection.original) {
          const distance = faceapi.euclideanDistance(
            faceDetection.original, 
            detections.descriptor
          );
          
          // Apply a non-linear transformation to emphasize differences
          const enhancedDistance = Math.pow(distance * 4, 1.5);
          const clampedDistance = Math.min(enhancedDistance, 2.0);
          
          console.log("Facial analysis complete - distance:", clampedDistance);
          setFacialDifference(clampedDistance);
          
          toast({
            title: "Analysis Complete",
            description: `Facial difference: ${clampedDistance.toFixed(2)}`
          });
        }
      } else {
        console.log("No face detected in modified image - recognition defeated");
        setFacialDifference(2.0); // Maximum difference
        toast({
          title: "Recognition Defeated",
          description: "The face is no longer detectable by AI!"
        });
      }
    } catch (error) {
      console.error("Error analyzing modified image:", error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Could not analyze facial differences."
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [cleanProcessedCanvasRef, isFaceApiLoaded, faceDetection, setFaceDetection, toast, isAnalyzing]);

  return {
    facialDifference,
    analyzeModifiedImage,
    isAnalyzing
  };
};
