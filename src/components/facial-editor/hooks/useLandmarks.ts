
import { useState } from 'react';

export const useLandmarks = (setFaceDetection: (detection: any) => void) => {
  // Start with landmarks visible by default
  const [showLandmarks, setShowLandmarks] = useState(true);

  const toggleLandmarks = () => {
    setShowLandmarks(prev => !prev);
  };

  // Handle direct landmark manipulation
  const handleLandmarkMove = (pointIndex: number, x: number, y: number) => {
    if (!setFaceDetection) return;
    
    setFaceDetection((faceDetection: any) => {
      if (!faceDetection?.landmarks) return faceDetection;
      
      // Create a proper deep copy to avoid mutation issues
      const updatedFaceDetection = JSON.parse(JSON.stringify(faceDetection));
      
      // Update the landmark position
      if (updatedFaceDetection.landmarks.positions && 
          updatedFaceDetection.landmarks.positions[pointIndex]) {
        updatedFaceDetection.landmarks.positions[pointIndex].x = x;
        updatedFaceDetection.landmarks.positions[pointIndex].y = y;
        
        console.log(`Moved landmark ${pointIndex} to (${x}, ${y})`);
      }
      
      return updatedFaceDetection;
    });
  };

  return {
    showLandmarks,
    toggleLandmarks,
    handleLandmarkMove
  };
};
