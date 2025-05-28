
import { useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { useToast } from "@/components/ui/use-toast";
import { createImageFromCanvas } from '../utils/canvasUtils';
import { FaceDetection } from './types';

interface FacialTelemetryDelta {
  overallDistance: number;
  eyeDistances: {
    leftEye: number;
    rightEye: number;
    eyeSpacing: number;
  };
  noseChanges: {
    width: number;
    length: number;
    position: number;
  };
  mouthChanges: {
    width: number;
    height: number;
    position: number;
  };
  faceShape: {
    width: number;
    jawline: number;
    chin: number;
  };
  confidenceChange: number;
}

export const useModifiedFaceAnalysis = (
  isFaceApiLoaded: boolean,
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>,
  faceDetection: FaceDetection | null,
  setFaceDetection: (detection: FaceDetection | null) => void
) => {
  const { toast } = useToast();
  const [facialDifference, setFacialDifference] = useState<number | null>(null);
  const [facialTelemetryDelta, setFacialTelemetryDelta] = useState<FacialTelemetryDelta | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const calculateLandmarkDistance = (landmarks1: any, landmarks2: any, indices: number[]) => {
    let totalDistance = 0;
    for (const index of indices) {
      const p1 = landmarks1.positions[index];
      const p2 = landmarks2.positions[index];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    return totalDistance / indices.length;
  };

  const analyzeModifiedImage = useCallback(async () => {
    if (!cleanProcessedCanvasRef.current || !isFaceApiLoaded) {
      console.log('Analysis skipped - missing requirements');
      return;
    }
    
    if (isAnalyzing) {
      console.log('Analysis already in progress, skipping');
      return;
    }
    
    console.log('Starting modified face analysis');
    setIsAnalyzing(true);
    
    try {
      const processedImage = await createImageFromCanvas(cleanProcessedCanvasRef.current);
      
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
        
        // Calculate overall similarity
        if (faceDetection.original) {
          const distance = faceapi.euclideanDistance(
            faceDetection.original, 
            detections.descriptor
          );
          
          const enhancedDistance = Math.pow(distance * 4, 1.5);
          const clampedDistance = Math.min(enhancedDistance, 2.0);
          
          setFacialDifference(clampedDistance);
          
          // Calculate detailed telemetry delta
          if (faceDetection.landmarks && detections.landmarks) {
            const originalLandmarks = faceDetection.landmarks;
            const modifiedLandmarks = detections.landmarks;
            
            // Eye region analysis (landmarks 36-47)
            const leftEyeIndices = [36, 37, 38, 39, 40, 41];
            const rightEyeIndices = [42, 43, 44, 45, 46, 47];
            const leftEyeDistance = calculateLandmarkDistance(originalLandmarks, modifiedLandmarks, leftEyeIndices);
            const rightEyeDistance = calculateLandmarkDistance(originalLandmarks, modifiedLandmarks, rightEyeIndices);
            
            // Eye spacing (distance between eye centers)
            const leftEyeCenter = originalLandmarks.positions[39];
            const rightEyeCenter = originalLandmarks.positions[42];
            const originalEyeSpacing = Math.sqrt(Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) + Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2));
            
            const leftEyeCenterMod = modifiedLandmarks.positions[39];
            const rightEyeCenterMod = modifiedLandmarks.positions[42];
            const modifiedEyeSpacing = Math.sqrt(Math.pow(rightEyeCenterMod.x - leftEyeCenterMod.x, 2) + Math.pow(rightEyeCenterMod.y - leftEyeCenterMod.y, 2));
            
            // Nose analysis (landmarks 27-35)
            const noseIndices = [27, 28, 29, 30, 31, 32, 33, 34, 35];
            const noseDistance = calculateLandmarkDistance(originalLandmarks, modifiedLandmarks, noseIndices);
            
            // Mouth analysis (landmarks 48-67)
            const mouthIndices = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67];
            const mouthDistance = calculateLandmarkDistance(originalLandmarks, modifiedLandmarks, mouthIndices);
            
            // Face outline analysis (landmarks 0-16)
            const faceOutlineIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
            const faceOutlineDistance = calculateLandmarkDistance(originalLandmarks, modifiedLandmarks, faceOutlineIndices);
            
            // Jawline specific (landmarks 0-8)
            const jawlineIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            const jawlineDistance = calculateLandmarkDistance(originalLandmarks, modifiedLandmarks, jawlineIndices);
            
            // Chin specific (landmarks 6-10)
            const chinIndices = [6, 7, 8, 9, 10];
            const chinDistance = calculateLandmarkDistance(originalLandmarks, modifiedLandmarks, chinIndices);
            
            const telemetryDelta: FacialTelemetryDelta = {
              overallDistance: clampedDistance,
              eyeDistances: {
                leftEye: leftEyeDistance,
                rightEye: rightEyeDistance,
                eyeSpacing: Math.abs(modifiedEyeSpacing - originalEyeSpacing)
              },
              noseChanges: {
                width: noseDistance * 0.8, // Weighted for width changes
                length: noseDistance * 1.2, // Weighted for length changes  
                position: noseDistance
              },
              mouthChanges: {
                width: mouthDistance * 0.9,
                height: mouthDistance * 1.1,
                position: mouthDistance
              },
              faceShape: {
                width: faceOutlineDistance,
                jawline: jawlineDistance,
                chin: chinDistance
              },
              confidenceChange: Math.abs((faceDetection.confidence || 0) - detections.detection.score)
            };
            
            setFacialTelemetryDelta(telemetryDelta);
          }
          
          console.log("Facial analysis complete - distance:", clampedDistance);
          
          toast({
            title: "Analysis Complete",
            description: `Facial difference: ${clampedDistance.toFixed(2)}`
          });
        }
      } else {
        console.log("No face detected in modified image - recognition defeated");
        setFacialDifference(2.0);
        setFacialTelemetryDelta(null);
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
  }, [cleanProcessedCanvasRef, isFaceApiLoaded, faceDetection?.original, faceDetection?.landmarks, faceDetection?.confidence, setFaceDetection, toast]);

  return {
    facialDifference,
    facialTelemetryDelta,
    analyzeModifiedImage,
    isAnalyzing
  };
};
