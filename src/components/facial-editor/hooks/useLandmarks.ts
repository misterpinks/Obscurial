
import { useState, useCallback } from 'react';
import { FaceDetection } from './types';

export interface Point {
  index: number;
}

export interface Position {
  x: number;
  y: number;
}

export const useLandmarks = (faceDetection: FaceDetection | null, setFaceDetection: (detection: FaceDetection | null) => void) => {
  const [showLandmarks, setShowLandmarks] = useState(false);

  // Toggle landmark visibility
  const toggleLandmarks = useCallback(() => {
    setShowLandmarks(prev => !prev);
  }, []);

  // Handle landmark point movement
  const handleLandmarkMove = useCallback((point: Point, newPosition: Position) => {
    if (!faceDetection || !faceDetection.landmarks) return;

    try {
      // Create a deep copy of the detection object to avoid mutation issues
      const updatedDetection = JSON.parse(JSON.stringify(faceDetection));
      
      // Update the position of the specific landmark point
      if (updatedDetection.landmarks._positions && 
          point.index < updatedDetection.landmarks._positions.length) {
        updatedDetection.landmarks._positions[point.index]._x = newPosition.x;
        updatedDetection.landmarks._positions[point.index]._y = newPosition.y;
      }
      
      // Update the face detection state with the modified landmarks
      setFaceDetection(updatedDetection);
    } catch (error) {
      console.error("Error updating landmark position:", error);
    }
  }, [faceDetection, setFaceDetection]);

  return {
    showLandmarks,
    toggleLandmarks,
    handleLandmarkMove
  };
};
