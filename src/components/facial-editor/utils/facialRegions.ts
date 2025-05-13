
/**
 * Configuration for facial regions and transformation parameters
 * Complete rewrite with continuous global transformation field and ultra-smooth transitions
 */

import { FacialRegion } from './transformationTypes';

// Significantly increased base amplification factor for more dramatic effects
export function getAmplificationFactor(): number {
  return 10.0; // Dramatically increased for more pronounced effects
}

// Get displacement for any pixel using a global continuous field approach
export function getDisplacement(
  normX: number, 
  normY: number, 
  distFromCenter: number,
  sliderValues: Record<string, number>,
  amplificationFactor: number
): { displacementX: number, displacementY: number } {
  // Initialize displacement
  let displacementX = 0;
  let displacementY = 0;
  
  // ---- CORE IMPROVEMENT: Using a continuous global transformation field ----
  // Each feature's influence blends smoothly with no defined boundaries
  // This approach eliminates any visible "box" or region boundaries
  
  // Global scale factor to make transformations more dramatic for facial recognition defeat
  const globalScaleFactor = 1.5; // Increased from previous version
  
  // ------ Eyes region with smooth falloff ------
  // Dynamic eye centers that adapt to face width
  const eyeSpread = 0.3 * (1 + (sliderValues.faceWidth || 0) / 200);
  const leftEyeCenterX = -eyeSpread;
  const rightEyeCenterX = eyeSpread;
  const eyeCenterY = -0.25;
  
  // Smooth radial influence calculation (no boundaries)
  const leftEyeDistance = Math.sqrt(Math.pow((normX - leftEyeCenterX) / 0.4, 2) + Math.pow((normY - eyeCenterY) / 0.3, 2));
  const rightEyeDistance = Math.sqrt(Math.pow((normX - rightEyeCenterX) / 0.4, 2) + Math.pow((normY - eyeCenterY) / 0.3, 2));
  const eyeDistance = Math.min(leftEyeDistance, rightEyeDistance);
  
  // Ultra smooth falloff that extends far beyond the eye region
  const eyeInfluence = Math.pow(Math.max(0, 1 - eyeDistance / 3.5), 3);
  
  // Apply eye size transformation
  if (sliderValues.eyeSize) {
    // Which eye are we closer to?
    const eyeCenterX = normX > 0 ? rightEyeCenterX : leftEyeCenterX;
    
    // Vector from eye center
    const vx = normX - eyeCenterX;
    const vy = normY - eyeCenterY;
    
    // Apply radial displacement with smooth falloff
    const eyeSizeFactor = (sliderValues.eyeSize / 100) * amplificationFactor * globalScaleFactor * eyeInfluence;
    displacementX += vx * eyeSizeFactor;
    displacementY += vy * eyeSizeFactor;
  }
  
  // Apply eye spacing transformation
  if (sliderValues.eyeSpacing) {
    // Direction depends on which half of face we're on
    const direction = normX > 0 ? 1 : -1;
    
    // Apply horizontal displacement with smooth falloff
    displacementX += direction * (sliderValues.eyeSpacing / 100) * amplificationFactor * globalScaleFactor * eyeInfluence;
  }
  
  // ------ Eyebrows with smooth falloff ------
  const browCenterY = -0.4;
  const leftBrowDistance = Math.sqrt(Math.pow((normX - leftEyeCenterX) / 0.4, 2) + Math.pow((normY - browCenterY) / 0.25, 2));
  const rightBrowDistance = Math.sqrt(Math.pow((normX - rightEyeCenterX) / 0.4, 2) + Math.pow((normY - browCenterY) / 0.25, 2));
  const browDistance = Math.min(leftBrowDistance, rightBrowDistance);
  
  // Smooth falloff with very wide influence
  const browInfluence = Math.pow(Math.max(0, 1 - browDistance / 3.0), 3);
  
  // Apply eyebrow transformations
  if (sliderValues.eyebrowHeight) {
    // Vertical displacement with smooth falloff
    displacementY += -(sliderValues.eyebrowHeight / 100) * amplificationFactor * globalScaleFactor * 2.5 * browInfluence;
  }
  
  // ------ Nose with smooth falloff ------
  const noseCenterY = 0;
  const noseDistance = Math.sqrt(Math.pow(normX / 0.4, 2) + Math.pow((normY - noseCenterY) / 0.4, 2));
  
  // Extended smooth falloff
  const noseInfluence = Math.pow(Math.max(0, 1 - noseDistance / 2.5), 3);
  
  // Apply nose transformations
  if (sliderValues.noseWidth) {
    // Horizontal displacement with smooth falloff
    displacementX += (sliderValues.noseWidth / 100) * normX * amplificationFactor * globalScaleFactor * 2.0 * noseInfluence;
  }
  
  if (sliderValues.noseLength) {
    // Vertical displacement with smooth falloff
    const verticalDirection = normY > 0 ? 1 : -1;
    displacementY += (sliderValues.noseLength / 100) * verticalDirection * amplificationFactor * globalScaleFactor * 2.0 * noseInfluence;
  }
  
  // ------ Mouth with smooth falloff ------
  const mouthCenterY = 0.25;
  const mouthDistance = Math.sqrt(Math.pow(normX / 0.5, 2) + Math.pow((normY - mouthCenterY) / 0.4, 2));
  
  // Extended smooth falloff
  const mouthInfluence = Math.pow(Math.max(0, 1 - mouthDistance / 2.5), 3);
  
  // Apply mouth transformations
  if (sliderValues.mouthWidth) {
    // Horizontal displacement with smooth falloff
    displacementX += (sliderValues.mouthWidth / 100) * normX * amplificationFactor * globalScaleFactor * 2.0 * mouthInfluence;
  }
  
  if (sliderValues.mouthHeight) {
    // Vertical displacement with smooth falloff
    displacementY += (sliderValues.mouthHeight / 100) * (normY - mouthCenterY) * amplificationFactor * globalScaleFactor * 2.0 * mouthInfluence;
  }
  
  // ------ Face width with smooth falloff from center to edge ------
  // Create a gradual falloff based on distance from center
  // This creates more distortion as you move toward the edge of the face
  const faceWidthInfluence = Math.pow(Math.min(1, distFromCenter / 0.9), 2);
  
  if (sliderValues.faceWidth) {
    // Horizontal displacement increases toward edges
    displacementX += (sliderValues.faceWidth / 100) * normX * amplificationFactor * globalScaleFactor * 2.0 * faceWidthInfluence;
  }
  
  // ------ Chin shape with smooth falloff ------
  const chinCenterY = 0.5;
  const chinDistance = Math.sqrt(Math.pow(normX / 0.4, 2) + Math.pow((normY - chinCenterY) / 0.4, 2));
  
  // Extended smooth falloff
  const chinInfluence = Math.pow(Math.max(0, 1 - chinDistance / 2.5), 3);
  
  if (sliderValues.chinShape) {
    // Vertical displacement with smooth falloff
    displacementY += (sliderValues.chinShape / 100) * (normY - 0.4) * amplificationFactor * globalScaleFactor * 2.0 * chinInfluence;
  }
  
  // ------ Jawline with smooth falloff ------
  // Complex influence field that targets jawline area
  const jawCenterY = 0.35;
  const jawAngle = Math.atan2(normY - jawCenterY, normX);
  
  // Create stronger effect at the sides of jaw
  const jawAngleFactor = Math.abs(Math.cos(jawAngle));
  
  // Distance factor stronger at edges
  const jawDistance = Math.sqrt(Math.pow(normX, 2) + Math.pow(normY - jawCenterY, 2));
  const jawDistanceFactor = Math.min(1, jawDistance / 0.7);
  
  // Combine for a smooth jaw-specific influence
  const jawInfluence = Math.pow(jawDistanceFactor * jawAngleFactor, 1.5);
  
  if (sliderValues.jawline) {
    // Horizontal displacement based on which side of face
    const direction = normX > 0 ? 1 : -1;
    displacementX += direction * (sliderValues.jawline / 100) * amplificationFactor * globalScaleFactor * 2.0 * jawInfluence;
  }
  
  // ------ Noise for facial recognition defeat ------
  // Add subtle noise displacement for more effective facial recognition defeat
  if (sliderValues.noiseLevel && sliderValues.noiseLevel > 0) {
    // Use pseudo-random noise based on position (not truly random to maintain consistency)
    const noiseX = Math.sin(normX * 50 + normY * 30) * 0.5 + 0.5;
    const noiseY = Math.cos(normX * 30 + normY * 50) * 0.5 + 0.5;
    
    // Scale noise by the noise level slider
    const noiseInfluence = sliderValues.noiseLevel / 100;
    
    // Add noise displacement
    displacementX += (noiseX - 0.5) * amplificationFactor * 0.5 * noiseInfluence;
    displacementY += (noiseY - 0.5) * amplificationFactor * 0.5 * noiseInfluence;
  }
  
  return { displacementX, displacementY };
}

// Legacy code kept for compatibility, but using the new approach
export const facialRegions: FacialRegion[] = [
  {
    // This is a placeholder implementation that uses the new getDisplacement function
    condition: () => true,
    transform: (normX, normY, sliderValues, amplification) => {
      return getDisplacement(normX, normY, Math.sqrt(normX*normX + normY*normY), sliderValues, amplification);
    }
  }
];
