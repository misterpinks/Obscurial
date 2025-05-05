
import { useState } from 'react';

export const useLandmarks = (setFaceDetection: (detection: any) => void) => {
  const [showLandmarks, setShowLandmarks] = useState(true);

  const toggleLandmarks = () => {
    setShowLandmarks(!showLandmarks);
  };

  // Handle direct landmark manipulation
  const handleLandmarkMove = (pointIndex: number, x: number, y: number) => {
    if (!setFaceDetection) return;
    
    setFaceDetection((faceDetection: any) => {
      if (!faceDetection?.landmarks) return faceDetection;
      
      // Create a deep copy of the face detection object to avoid mutation issues
      const updatedFaceDetection = JSON.parse(JSON.stringify(faceDetection));
      
      // Update the landmark position
      updatedFaceDetection.landmarks.positions[pointIndex] = { x, y };
      
      // Return updated face detection
      return updatedFaceDetection;
    });
  };

  return {
    showLandmarks,
    toggleLandmarks,
    handleLandmarkMove
  };
};
