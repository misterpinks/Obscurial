
/**
 * Functions for visualizing facial landmarks
 */

// Draw landmarks on the processed canvas with improved UI for interaction
export const drawFaceLandmarks = (
  canvas: HTMLCanvasElement, 
  faceDetection: any, 
  originalImage: HTMLImageElement
) => {
  if (!faceDetection?.landmarks) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Color coding by feature groups
  const featureGroups = {
    eyes: { points: [0, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], color: '#1EAEDB' },
    nose: { points: [27, 28, 29, 30, 31, 32, 33, 34, 35], color: '#222222' },
    mouth: { points: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67], color: '#ea384c' },
    face: { points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], color: '#F97316' }
  };
  
  // Draw face bounding box - light green
  ctx.strokeStyle = '#F2FCE2';
  ctx.lineWidth = 2;
  const box = faceDetection.detection.box;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  
  // Draw all landmarks by feature group
  const landmarks = faceDetection.landmarks.positions;
  
  // Draw points for each feature group
  Object.entries(featureGroups).forEach(([groupName, group]) => {
    ctx.fillStyle = group.color;
    ctx.strokeStyle = group.color;
    
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
    
    // Draw points - with larger interactive points
    group.points.forEach(pointIdx => {
      ctx.beginPath();
      // Make points slightly larger for better interaction
      ctx.arc(landmarks[pointIdx].x, landmarks[pointIdx].y, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add a highlight border for better visibility
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  });
  
  // Add hint text at the bottom for user interaction
  ctx.font = '12px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(10, canvas.height - 30, 200, 20);
  ctx.fillStyle = 'black';
  ctx.fillText('Click and drag points to move landmarks', 15, canvas.height - 15);
};
