
import { useEffect } from 'react';
import { useFaceDetectionContext } from '../context/FaceDetectionContext';

export const useFaceDetection = (
  originalImage: HTMLImageElement | null,
  initialProcessingDone: boolean,
  setInitialProcessingDone: (value: boolean) => void,
) => {
  const faceDetectionContext = useFaceDetectionContext();
  
  // Trigger face detection when image changes but only once
  useEffect(() => {
    if (originalImage && !initialProcessingDone) {
      // Use a small delay to ensure the image is fully loaded
      const timerId = setTimeout(() => {
        faceDetectionContext.detectFaces(originalImage)
          .finally(() => {
            // Always mark processing as done, even if detection fails
            setInitialProcessingDone(true);
          });
      }, 100);
      
      return () => clearTimeout(timerId);
    }
  }, [originalImage, initialProcessingDone, setInitialProcessingDone, faceDetectionContext]);

  return { ...faceDetectionContext };
};
