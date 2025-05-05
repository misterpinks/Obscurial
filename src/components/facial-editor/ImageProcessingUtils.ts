
import React from 'react';

// Helper to create image from canvas
export const createImageFromCanvas = (canvas: HTMLCanvasElement): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = canvas.toDataURL('image/png');
  });
};

// Interface for the parameters of applyFeatureTransformations
interface TransformationParams {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  width: number;
  height: number;
  faceDetection: any;
  sliderValues: Record<string, number>;
}

// Updated function to apply more dramatic transformations with the -100/+100 slider range
export const applyFeatureTransformations = ({
  ctx,
  originalImage,
  width,
  height,
  faceDetection,
  sliderValues
}: TransformationParams) => {
  // Create an off-screen canvas for processing
  const offCanvas = document.createElement("canvas");
  offCanvas.width = width;
  offCanvas.height = height;
  const offCtx = offCanvas.getContext("2d");
  if (!offCtx || !originalImage) return;
  
  // Draw original to off-screen canvas
  offCtx.drawImage(originalImage, 0, 0);
  const originalData = offCtx.getImageData(0, 0, width, height);
  
  // Create output image data
  const outputData = ctx.createImageData(width, height);
  
  // Approximate face center - use face detection if available, otherwise estimate
  let centerX = width / 2;
  let centerY = height / 2;
  let faceWidth = width * 0.6;
  let faceHeight = height * 0.7;
  
  // Use detected face box if available
  if (faceDetection && faceDetection.detection) {
    const box = faceDetection.detection.box;
    centerX = box.x + box.width / 2;
    centerY = box.y + box.height / 2;
    // Make face area 25% larger than detected to avoid edge artifacts
    faceWidth = box.width * 1.25;
    faceHeight = box.height * 1.25;
  }
  
  // Amplification factor for transformations - significantly increased for more dramatic effects
  // Increase amplification factor from 2.0 to 3.5
  const amplificationFactor = 3.5;
  
  // Apply distortions based on slider values
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate normalized position relative to face center
      const normX = (x - centerX) / (faceWidth / 2);
      const normY = (y - centerY) / (faceHeight / 2);
      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      
      // Skip if outside approximate face area
      if (distFromCenter > 1.3) {
        // Just copy original pixel for areas outside the face
        const i = (y * width + x) * 4;
        outputData.data[i] = originalData.data[i];
        outputData.data[i + 1] = originalData.data[i + 1];
        outputData.data[i + 2] = originalData.data[i + 2];
        outputData.data[i + 3] = originalData.data[i + 3];
        continue;
      }
      
      // Calculate displacement based on facial feature sliders
      let displacementX = 0;
      let displacementY = 0;
      
      // Eye region - expanded region and effect
      if (normY < -0.15 && normY > -0.65 && Math.abs(normX) > 0.1 && Math.abs(normX) < 0.45) {
        // Apply eye size transformation with increased effect
        displacementX += (sliderValues.eyeSize / 100) * normX * amplificationFactor;
        displacementY += (sliderValues.eyeSize / 100) * normY * amplificationFactor;
        
        // Apply eye spacing transformation with increased effect
        displacementX += (sliderValues.eyeSpacing / 100) * (normX > 0 ? 1 : -1) * amplificationFactor;
      }
      
      // Eyebrow region - just above eyes - expanded and intensified
      if (normY < -0.25 && normY > -0.75 && Math.abs(normX) > 0.05 && Math.abs(normX) < 0.5) {
        // Increased effect for eyebrow height
        displacementY -= (sliderValues.eyebrowHeight / 100) * amplificationFactor * 1.25;
      }
      
      // Nose region - expanded with more dramatic effects
      if (Math.abs(normX) < 0.25 && normY > -0.4 && normY < 0.25) {
        // Intensified nose transformations
        displacementX += (sliderValues.noseWidth / 100) * normX * amplificationFactor * 1.5;
        displacementY += (sliderValues.noseLength / 100) * (normY > 0 ? 1 : -1) * amplificationFactor * 1.2;
      }
      
      // Mouth region - expanded with more dramatic effects
      if (Math.abs(normX) < 0.35 && normY > 0.05 && normY < 0.45) {
        // Intensified mouth transformations
        displacementX += (sliderValues.mouthWidth / 100) * normX * amplificationFactor * 1.5;
        displacementY += (sliderValues.mouthHeight / 100) * (normY - 0.25) * amplificationFactor * 1.3;
      }
      
      // Overall face width - expanded with more dramatic effect
      if (distFromCenter > 0.4 && distFromCenter < 1.1) {
        // More dramatic face width transformation
        displacementX += (sliderValues.faceWidth / 100) * normX * amplificationFactor * 1.4;
      }
      
      // Chin shape - expanded with more dramatic effect
      if (normY > 0.35 && Math.abs(normX) < 0.35) {
        // More dramatic chin shape transformation
        displacementY += (sliderValues.chinShape / 100) * (normY - 0.4) * amplificationFactor * 1.6;
      }
      
      // Jawline - expanded with more dramatic effect
      if (normY > 0.15 && Math.abs(normX) > 0.25 && Math.abs(normX) < 0.65) {
        // More dramatic jawline transformation
        displacementX += (sliderValues.jawline / 100) * (normX > 0 ? 1 : -1) * amplificationFactor * 1.5;
      }
      
      // Apply custom landmark deformation if available
      if (faceDetection?.landmarks?.positions) {
        // This is a simplified approach that could be enhanced further
      }
      
      // Calculate sample position with displacement
      const sampleX = x - displacementX;
      const sampleY = y - displacementY;
      
      // Use bilinear interpolation to sample original image
      const x1 = Math.floor(sampleX);
      const y1 = Math.floor(sampleY);
      const x2 = Math.min(x1 + 1, width - 1);
      const y2 = Math.min(y1 + 1, height - 1);
      
      const xWeight = sampleX - x1;
      const yWeight = sampleY - y1;
      
      const index = (y * width + x) * 4;
      
      // Bilinear interpolation for each color channel
      for (let c = 0; c < 3; c++) {
        const topLeft = originalData.data[(y1 * width + x1) * 4 + c];
        const topRight = originalData.data[(y1 * width + x2) * 4 + c];
        const bottomLeft = originalData.data[(y2 * width + x1) * 4 + c];
        const bottomRight = originalData.data[(y2 * width + x2) * 4 + c];
        
        const top = topLeft + (topRight - topLeft) * xWeight;
        const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight;
        let interpolated = top + (bottom - top) * yWeight;
        
        // Clamp values between 0-255
        outputData.data[index + c] = Math.min(255, Math.max(0, interpolated));
      }
      
      // Alpha channel stays the same
      outputData.data[index + 3] = originalData.data[(y1 * width + x1) * 4 + 3];
    }
  }
  
  // Put the processed image data onto the canvas
  ctx.putImageData(outputData, 0, 0);
};

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
