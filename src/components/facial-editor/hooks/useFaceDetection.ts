
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFaceDetectionContext } from '../context/FaceDetectionContext';

export const useFaceDetection = (
  originalImage: HTMLImageElement | null,
  initialProcessingDone: boolean,
  setInitialProcessingDone: (value: boolean) => void,
) => {
  const faceDetectionContext = useFaceDetectionContext();
  const detectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const detectionAttemptRef = useRef<number>(0);
  const lastDetectionTimeRef = useRef<number>(0);
  
  // Clear any existing timers when component unmounts
  useEffect(() => {
    return () => {
      if (detectionTimerRef.current) {
        clearTimeout(detectionTimerRef.current);
      }
    };
  }, []);

  // Enhanced face detection with retry logic and debouncing
  const enhancedDetectFaces = useCallback(() => {
    if (originalImage && !faceDetectionContext.isAnalyzing) {
      // Prevent multiple detection requests in quick succession
      const now = Date.now();
      if (now - lastDetectionTimeRef.current < 1000 && detectionAttemptRef.current > 0) {
        console.log("Detection request throttled");
        return;
      }
      
      lastDetectionTimeRef.current = now;
      console.log(`Starting face detection attempt: ${detectionAttemptRef.current + 1}`);
      console.log(`Image dimensions: ${originalImage.width} x ${originalImage.height}`);
      
      detectionAttemptRef.current += 1;
      
      // Only proceed with detection if we have a valid image and aren't already analyzing
      return faceDetectionContext.detectFaces(originalImage)
        .then(() => {
          // If successful, mark processing as complete
          setInitialProcessingDone(true);
          detectionAttemptRef.current = 0; // Reset attempts counter on success
          console.log("Face detection completed successfully");
        })
        .catch(error => {
          console.error("Face detection error:", error);
          
          // If we've tried less than 3 times, try again after a delay
          if (detectionAttemptRef.current < 3) {
            console.log(`Scheduling retry #${detectionAttemptRef.current + 1} for face detection...`);
            detectionTimerRef.current = setTimeout(() => {
              enhancedDetectFaces();
            }, 1000);
          } else {
            // After multiple failures, just proceed without face detection
            console.log("Multiple face detection attempts failed, proceeding without detection");
            setInitialProcessingDone(true);
          }
        });
    } else {
      // If we can't detect faces, still mark processing as done so UI doesn't hang
      if (!initialProcessingDone) {
        console.log("Can't detect faces, marking processing as done anyway");
        setInitialProcessingDone(true);
      }
      return Promise.resolve();
    }
  }, [originalImage, faceDetectionContext, setInitialProcessingDone, initialProcessingDone]);

  // Trigger face detection when image changes but only once
  useEffect(() => {
    if (originalImage && !initialProcessingDone) {
      // Use a small delay to ensure the image is fully loaded
      detectionTimerRef.current = setTimeout(() => {
        // Reset attempt counter
        detectionAttemptRef.current = 0;
        enhancedDetectFaces();
      }, 500);
      
      return () => {
        if (detectionTimerRef.current) {
          clearTimeout(detectionTimerRef.current);
        }
      };
    }
  }, [originalImage, initialProcessingDone, enhancedDetectFaces]);

  return { 
    ...faceDetectionContext,
    detectFaces: enhancedDetectFaces,
    detectionAttempts: detectionAttemptRef.current
  };
};
