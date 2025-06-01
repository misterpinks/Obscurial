
/**
 * Utility for visualizing facial landmarks
 */

// Function to draw facial landmarks on a canvas
export const drawFaceLandmarks = (
  ctx: CanvasRenderingContext2D,
  faceDetection: any,
  pointSize: number = 3,
  lineWidth: number = 1
) => {
  if (!faceDetection?.landmarks || !ctx) {
    console.log("Missing data for drawing landmarks");
    return;
  }
  
  try {
    console.log("Drawing landmarks");
    
    // Calculate a scaling factor based on image dimensions
    // This ensures landmarks are visible regardless of image size
    const canvas = ctx.canvas;
    const imageDimension = Math.max(canvas.width, canvas.height);
    
    // Improved scaling formula for better visibility on large images
    let calculatedPointSize = Math.max(3, Math.floor(imageDimension / 150)); // More aggressive scaling
    let calculatedLineWidth = Math.max(1.5, Math.floor(imageDimension / 300)); // Thicker lines
    
    // Use provided sizes if explicitly passed, otherwise use calculated ones
    const finalPointSize = pointSize !== 3 ? pointSize : calculatedPointSize;
    const finalLineWidth = lineWidth !== 1 ? lineWidth : calculatedLineWidth;
    
    // Cap sizes for very large images - increased caps
    const maxPointSize = 20; // Increased from 7
    const maxLineWidth = 6; // Increased from 3
    
    const effectivePointSize = Math.min(finalPointSize, maxPointSize);
    const effectiveLineWidth = Math.min(finalLineWidth, maxLineWidth);
    
    console.log(`Using landmark point size: ${effectivePointSize}, line width: ${effectiveLineWidth} for image dimension: ${imageDimension}`);
    
    // Color coding by feature groups with updated colors
    const featureGroups = {
      eyes: { points: [0, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], color: '#1EAEDB' },
      nose: { points: [27, 28, 29, 30, 31, 32, 33, 34, 35], color: '#FEF7CD' },
      mouth: { points: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67], color: '#ea384c' },
      face: { points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], color: '#F97316' }
    };
    
    // Draw face bounding box - bright green (#00ff00) - FIXED
    if (faceDetection.detection && faceDetection.detection.box) {
      ctx.strokeStyle = '#00ff00'; // Bright green
      ctx.lineWidth = effectiveLineWidth * 2;
      const box = faceDetection.detection.box;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
    
    // Draw all landmarks by feature group
    if (faceDetection.landmarks && faceDetection.landmarks.positions) {
      const landmarks = faceDetection.landmarks.positions;
      
      // Draw points for each feature group
      Object.entries(featureGroups).forEach(([groupName, group]) => {
        ctx.fillStyle = group.color;
        ctx.strokeStyle = group.color;
        ctx.lineWidth = effectiveLineWidth;
        
        // Connect points for better visualization
        if (group.points.length > 1) {
          ctx.beginPath();
          
          // Check if the first point exists
          if (landmarks[group.points[0]]) {
            ctx.moveTo(landmarks[group.points[0]].x, landmarks[group.points[0]].y);
            
            for (let i = 1; i < group.points.length; i++) {
              if (landmarks[group.points[i]]) {
                ctx.lineTo(landmarks[group.points[i]].x, landmarks[group.points[i]].y);
              }
            }
            
            // Close the path for face
            if (groupName === 'face') {
              ctx.closePath();
            }
            
            ctx.stroke();
          }
        }
        
        // Draw points
        group.points.forEach(pointIdx => {
          if (landmarks[pointIdx]) {
            ctx.beginPath();
            ctx.arc(landmarks[pointIdx].x, landmarks[pointIdx].y, effectivePointSize, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      });
    }
  } catch (error) {
    console.error("Error drawing landmarks:", error);
  }
};
