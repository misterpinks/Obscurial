
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
  let faceWidth = width * 0.7; // Increased from 0.6 to cover more area
  let faceHeight = height * 0.8; // Increased from 0.7 to cover more area
  
  // Use detected face box if available
  if (faceDetection && faceDetection.detection) {
    const box = faceDetection.detection.box;
    centerX = box.x + box.width / 2;
    centerY = box.y + box.height / 2;
    // Make face area 40% larger than detected to avoid edge artifacts (increased from 25%)
    faceWidth = box.width * 1.4;
    faceHeight = box.height * 1.4;
  }
  
  // Get facial regions and amplification factor
  const facialRegions = getFacialRegions();
  
  // Calculate dynamic amplification factor based on image dimensions
  // This ensures that larger images get stronger effects
  const baseAmplificationFactor = getAmplificationFactor();
  
  // Additional multiplier based on image dimensions
  // Normalize based on a standard size of 500x500
  const sizeFactor = Math.sqrt((width * height) / (500 * 500));
  
  // Combine base amplification with size factor and a stronger overall effect
  const amplificationFactor = baseAmplificationFactor * sizeFactor * 2.0;
  
  console.log("Image size:", width, "x", height);
  console.log("Size factor:", sizeFactor);
  console.log("Total amplification factor:", amplificationFactor);
  
  // Apply super-strong distortion effect for extreme values
  const extremeThreshold = 75; // When slider exceeds this value, apply extreme effect
  let hasExtremeValues = false;
  
  // Check if any sliders are at extreme values
  Object.values(sliderValues).forEach(value => {
    if (Math.abs(value) >= extremeThreshold) {
      hasExtremeValues = true;
    }
  });

  // Calculate the maximum influence distance from face center
  // This ensures smoother transitions between transformed and non-transformed regions
  const maxInfluenceDistance = hasExtremeValues ? 1.8 : 1.5; // Increased from 1.5/1.3
  
  // Apply distortions based on slider values
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate normalized position relative to face center
      const normX = (x - centerX) / (faceWidth / 2);
      const normY = (y - centerY) / (faceHeight / 2);
      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      
      // Skip if outside approximate face area (with some expansion for extreme values)
      if (distFromCenter > maxInfluenceDistance) {
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
      
      // Apply additional transition zone for smoother blending at edges
      if (distFromCenter > 1.0 && distFromCenter < maxInfluenceDistance) {
        // Calculate fade factor (1.0 at inner edge, 0.0 at outer edge)
        const fadeFactor = 1.0 - ((distFromCenter - 1.0) / (maxInfluenceDistance - 1.0));
        displacementX *= fadeFactor;
        displacementY *= fadeFactor;
      }
      
      // Apply additional chaotic displacement for extreme values
      if (hasExtremeValues) {
        // Add some chaotic, but deterministic displacement based on position
        const chaosX = Math.sin(y * 0.1) * Math.cos(x * 0.1) * 5.0;
        const chaosY = Math.cos(y * 0.1) * Math.sin(x * 0.1) * 5.0;
        
        // Scale chaos by distance from center to avoid affecting the core face too much
        const chaosFactor = Math.min(1.0, distFromCenter / 0.8);
        
        displacementX += chaosX * chaosFactor;
        displacementY += chaosY * chaosFactor;
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
      
      // If out of bounds, use a boundary color or skip
      if (x1 < 0 || y1 < 0 || x2 >= width || y2 >= height) {
        // Use a solid color for out-of-bounds
        outputData.data[index] = 0; // R
        outputData.data[index + 1] = 0; // G
        outputData.data[index + 2] = 0; // B
        outputData.data[index + 3] = 255; // A
        continue;
      }
      
      // Bilinear interpolation for each color channel
      for (let c = 0; c < 3; c++) {
        const topLeft = originalData.data[(y1 * width + x1) * 4 + c];
        const topRight = originalData.data[(y1 * width + x2) * 4 + c];
        const bottomLeft = originalData.data[(y2 * width + x1) * 4 + c];
        const bottomRight = originalData.data[(y2 * width + x2) * 4 + c];
        
        const top = topLeft + (topRight - topLeft) * xWeight;
        const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight;
        let interpolated = top + (bottom - top) * yWeight;
        
        // For extreme values, add subtle color shifting
        if (hasExtremeValues) {
          // Apply subtle color shifts based on position
          const colorShift = Math.sin(x * 0.05 + y * 0.05) * 15; // Reduced from 30 to be more subtle
          interpolated += colorShift;
        }
        
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
