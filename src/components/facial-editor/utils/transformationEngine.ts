
import { TransformationParams } from './transformationTypes';
import { getFacialRegions, getAmplificationFactor, getMaxInfluenceDistance } from './facialRegions';

/**
 * Core transformation engine for applying facial feature modifications
 */

// Enhanced function to apply transformations with improved edge handling
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
  const offCtx = offCanvas.getContext("2d", { alpha: false });
  if (!offCtx || !originalImage) return;
  
  // Draw original to off-screen canvas
  offCtx.drawImage(originalImage, 0, 0);
  const originalData = offCtx.getImageData(0, 0, width, height);
  
  // Create output image data
  const outputData = ctx.createImageData(width, height);
  
  // Approximate face center - use face detection if available, otherwise estimate
  let centerX = width / 2;
  let centerY = height / 2;
  let faceWidth = width * 0.8;
  let faceHeight = height * 0.9;
  
  // Use detected face box if available
  if (faceDetection && faceDetection.detection) {
    const box = faceDetection.detection.box;
    centerX = box.x + box.width / 2;
    centerY = box.y + box.height / 2;
    // Make face area larger than detected to avoid edge artifacts
    faceWidth = box.width * 1.5;
    faceHeight = box.height * 1.5;
  }
  
  // Get facial regions and amplification factor
  const facialRegions = getFacialRegions();
  
  // Calculate dynamic amplification factor based on image dimensions
  const baseAmplificationFactor = getAmplificationFactor();
  
  // Normalize based on a standard size of 500x500
  const sizeFactor = Math.sqrt((width * height) / (500 * 500));
  
  // Combine base amplification with size factor
  const amplificationFactor = baseAmplificationFactor * sizeFactor * 1.5;
  
  console.log("Image size:", width, "x", height);
  console.log("Size factor:", sizeFactor);
  console.log("Total amplification factor:", amplificationFactor);
  
  // Safety check for extreme values - automatically clamp them
  const clampedSliderValues = { ...sliderValues };
  Object.keys(clampedSliderValues).forEach(key => {
    // Apply gradual dampening to extreme values
    const value = clampedSliderValues[key];
    if (Math.abs(value) > 60) {
      const excess = Math.abs(value) - 60;
      // Apply logarithmic dampening to excess values
      const dampened = 60 + Math.log10(1 + excess) * 5;
      clampedSliderValues[key] = value > 0 ? dampened : -dampened;
    }
  });
  
  // Calculate the maximum influence distance from face center
  // for smoother transitions between transformed and non-transformed regions
  const maxInfluenceDistance = getMaxInfluenceDistance();
  
  // Improved boundary detection and handling
  const safetyMargin = 5; // pixels of safety margin
  
  // Apply distortions based on slider values with wider influence area
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate normalized position relative to face center
      const normX = (x - centerX) / (faceWidth / 2);
      const normY = (y - centerY) / (faceHeight / 2);
      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      
      // Skip if outside approximate face area
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
          const displacement = region.transform(
            normX, normY, clampedSliderValues, amplificationFactor
          );
          displacementX += displacement.displacementX;
          displacementY += displacement.displacementY;
        }
      }
      
      // Apply additional transition zone for smoother blending at edges
      if (distFromCenter > 0.8 && distFromCenter < maxInfluenceDistance) {
        // Calculate fade factor (1.0 at inner edge, 0.0 at outer edge)
        const fadeFactor = 1.0 - ((distFromCenter - 0.8) / (maxInfluenceDistance - 0.8));
        // Apply smoother quadratic easing
        const smoothFadeFactor = fadeFactor * fadeFactor;
        displacementX *= smoothFadeFactor;
        displacementY *= smoothFadeFactor;
      }
      
      // Calculate sample position with displacement
      const sampleX = x - displacementX;
      const sampleY = y - displacementY;
      
      // Check image boundaries before sampling
      if (sampleX < safetyMargin || sampleY < safetyMargin || 
          sampleX >= width - safetyMargin || sampleY >= height - safetyMargin) {
        // For near-edge pixels, gradually reduce the displacement to prevent artifacts
        let adjustedSampleX = sampleX;
        let adjustedSampleY = sampleY;
        
        // Edge handling for X coordinate
        if (sampleX < safetyMargin) {
          adjustedSampleX = safetyMargin;
        } else if (sampleX >= width - safetyMargin) {
          adjustedSampleX = width - safetyMargin - 1;
        }
        
        // Edge handling for Y coordinate
        if (sampleY < safetyMargin) {
          adjustedSampleY = safetyMargin;
        } else if (sampleY >= height - safetyMargin) {
          adjustedSampleY = height - safetyMargin - 1;
        }
        
        // Use bilinear interpolation with clamped coordinates
        const x1 = Math.floor(adjustedSampleX);
        const y1 = Math.floor(adjustedSampleY);
        const x2 = Math.min(x1 + 1, width - 1);
        const y2 = Math.min(y1 + 1, height - 1);
        
        const xWeight = adjustedSampleX - x1;
        const yWeight = adjustedSampleY - y1;
        
        const index = (y * width + x) * 4;
        
        // Bilinear interpolation for each color channel
        for (let c = 0; c < 3; c++) {
          const topLeft = originalData.data[(y1 * width + x1) * 4 + c];
          const topRight = originalData.data[(y1 * width + x2) * 4 + c];
          const bottomLeft = originalData.data[(y2 * width + x1) * 4 + c];
          const bottomRight = originalData.data[(y2 * width + x2) * 4 + c];
          
          const top = topLeft + (topRight - topLeft) * xWeight;
          const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight;
          const interpolated = top + (bottom - top) * yWeight;
          
          // Clamp values between 0-255
          outputData.data[index + c] = Math.min(255, Math.max(0, interpolated));
        }
        
        // Alpha channel
        outputData.data[index + 3] = originalData.data[(y1 * width + x1) * 4 + 3];
      } else {
        // Use bilinear interpolation for interior pixels
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
          const interpolated = top + (bottom - top) * yWeight;
          
          // Clamp values between 0-255
          outputData.data[index + c] = Math.min(255, Math.max(0, interpolated));
        }
        
        // Alpha channel
        outputData.data[index + 3] = originalData.data[(y1 * width + x1) * 4 + 3];
      }
    }
  }
  
  // Put the processed image data onto the canvas
  ctx.putImageData(outputData, 0, 0);
};
