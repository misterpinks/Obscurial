
import { TransformationParams } from './transformationTypes';
import { getFacialRegions, getAmplificationFactor } from './facialRegions';

/**
 * Core transformation engine for applying facial feature modifications
 */

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
  
  // Get facial regions and amplification factor
  const facialRegions = getFacialRegions();
  const amplificationFactor = getAmplificationFactor();
  
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
      
      // Calculate displacement based on facial feature regions
      let displacementX = 0;
      let displacementY = 0;
      
      // Process each facial region
      for (const region of facialRegions) {
        if (region.condition(normX, normY, distFromCenter)) {
          const displacement = region.transform(normX, normY, sliderValues, amplificationFactor);
          displacementX += displacement.displacementX;
          displacementY += displacement.displacementY;
        }
      }
      
      // Apply custom landmark deformation if available (placeholder for future enhancement)
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
