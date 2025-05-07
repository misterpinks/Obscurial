
import { useCallback } from 'react';

interface UseLandmarksDrawingProps {
  faceDetection: any;
  processedCanvasRef: React.RefObject<HTMLCanvasElement>;
  originalImage: HTMLImageElement | null;
}

export const useLandmarksDrawing = ({
  faceDetection,
  processedCanvasRef,
  originalImage
}: UseLandmarksDrawingProps) => {
  
  // Draw landmarks on the processed canvas with updated colors and better scaling
  const drawFaceLandmarks = useCallback(() => {
    if (!faceDetection?.landmarks || !processedCanvasRef.current || !originalImage) {
      console.log("Cannot draw landmarks: missing detection, canvas or image");
      return;
    }
    
    console.log("Drawing landmarks on canvas");
    
    const canvas = processedCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // Calculate a scaling factor based on image dimensions
    // This ensures landmarks are visible regardless of image size
    const imageDimension = Math.max(originalImage.width, originalImage.height);
    let pointSize = Math.max(3, Math.floor(imageDimension / 200)); // Minimum size of 3
    let lineWidth = Math.max(2, Math.floor(imageDimension / 400)); // Minimum line width of 2
    
    // Cap sizes for very large images
    pointSize = Math.min(pointSize, 8); 
    lineWidth = Math.min(lineWidth, 4);
    
    console.log(`Using landmark point size: ${pointSize}, line width: ${lineWidth} for image dimension: ${imageDimension}`);
    
    // Color coding by feature groups with updated colors
    const featureGroups = {
      eyes: { points: [0, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], color: '#1EAEDB' },
      nose: { points: [27, 28, 29, 30, 31, 32, 33, 34, 35], color: '#FEF7CD' },
      mouth: { points: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67], color: '#ea384c' },
      face: { points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], color: '#F97316' }
    };
    
    // Draw face bounding box with higher visibility
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = lineWidth * 2;
    const box = faceDetection.detection.box;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // Draw all landmarks by feature group
    const landmarks = faceDetection.landmarks.positions;
    
    // Draw points for each feature group
    Object.entries(featureGroups).forEach(([groupName, group]) => {
      ctx.fillStyle = group.color;
      ctx.strokeStyle = group.color;
      ctx.lineWidth = lineWidth;
      
      // Connect points for better visualization
      if (group.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(landmarks[group.points[0]].x, landmarks[group.points[0]].y);
        
        for (let i = 1; i < group.points.length; i++) {
          ctx.lineTo(landmarks[group.points[i]].x, landmarks[group.points[i]].y);
        }
        
        // Close the path for face
        if (groupName === 'face') {
          ctx.closePath();
        }
        
        ctx.stroke();
      }
      
      // Draw points with scaled size and ensure they're visible
      group.points.forEach(pointIdx => {
        ctx.beginPath();
        ctx.arc(landmarks[pointIdx].x, landmarks[pointIdx].y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    });
    
    console.log("Landmarks drawn successfully");
  }, [faceDetection, processedCanvasRef, originalImage]);

  return { drawFaceLandmarks };
};
