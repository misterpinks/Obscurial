/**
 * Configuration for facial regions and transformation parameters
 * Improved with global transformation field and ultra-smooth transitions
 */

import { FacialRegion } from './transformationTypes';

// Significantly increased base amplification factor for more dramatic effects
export function getAmplificationFactor(): number {
  return 7.0; // Dramatically increased for more pronounced effects (from 5.0)
}

// Get displacement for any pixel using a smooth, continuous field approach
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
  
  // For each facial region, calculate its contribution to the displacement
  // and blend them using ultra-smooth weight functions
  
  // Eye region
  {
    // Use multiple eye centers with elliptical distance calculation
    const leftEyeCenterX = -0.3;
    const rightEyeCenterX = 0.3;
    const eyeCenterY = -0.25;
    
    // Calculate distances from each eye with elliptical weighting
    const dxLeft = (normX - leftEyeCenterX) / 0.4;
    const dxRight = (normX - rightEyeCenterX) / 0.4;
    const dy = (normY - eyeCenterY) / 0.3;
    
    const distFromLeftEye = Math.sqrt(dxLeft*dxLeft + dy*dy);
    const distFromRightEye = Math.sqrt(dxRight*dxRight + dy*dy);
    
    // Choose the closest eye for influence
    const distFromEye = Math.min(distFromLeftEye, distFromRightEye);
    
    // Create ultra smooth falloff with 7th order polynomial for perfect transitions
    const maxEyeDistance = 1.8; // Expanded influence area 
    const eyeFalloff = Math.max(0, 1 - (distFromEye / maxEyeDistance));
    const eyeWeight = eyeFalloff * eyeFalloff * eyeFalloff * (eyeFalloff * (eyeFalloff * 6 - 15) + 10);
    
    // Apply eye size transformation
    if (sliderValues.eyeSize) {
      // Calculate vector from eye center to current point
      const eyeCenterX = normX > 0 ? rightEyeCenterX : leftEyeCenterX;
      const vx = normX - eyeCenterX;
      const vy = normY - eyeCenterY;
      
      // Apply radial displacement scaled by eye size
      displacementX += (sliderValues.eyeSize / 100) * vx * amplificationFactor * eyeWeight;
      displacementY += (sliderValues.eyeSize / 100) * vy * amplificationFactor * eyeWeight;
    }
    
    // Apply eye spacing transformation with smooth blending
    if (sliderValues.eyeSpacing) {
      // Direction depends on which side of the face we're on
      const direction = normX > 0 ? 1 : -1;
      displacementX += (sliderValues.eyeSpacing / 100) * direction * amplificationFactor * eyeWeight;
    }
  }
  
  // Eyebrow region with improved spatial weighting
  {
    const leftBrowCenterX = -0.3;
    const rightBrowCenterX = 0.3;
    const browCenterY = -0.4;
    
    // Calculate distances with elliptical weighting
    const dxLeft = (normX - leftBrowCenterX) / 0.4;
    const dxRight = (normX - rightBrowCenterX) / 0.4;
    const dy = (normY - browCenterY) / 0.25;
    
    const distFromLeftBrow = Math.sqrt(dxLeft*dxLeft + dy*dy);
    const distFromRightBrow = Math.sqrt(dxRight*dxRight + dy*dy);
    
    // Choose the closest brow for influence
    const distFromBrow = Math.min(distFromLeftBrow, distFromRightBrow);
    
    // Create smooth falloff
    const maxBrowDistance = 1.8;
    const browFalloff = Math.max(0, 1 - (distFromBrow / maxBrowDistance));
    const browWeight = browFalloff * browFalloff * browFalloff * (browFalloff * (browFalloff * 6 - 15) + 10);
    
    // Apply eyebrow height transformation
    if (sliderValues.eyebrowHeight) {
      displacementY += -(sliderValues.eyebrowHeight / 100) * amplificationFactor * 2.2 * browWeight;
    }
  }
  
  // Nose region with circular influence
  {
    // Circular distance from nose center with adjustable influence area
    const noseCenterY = 0;
    const dx = normX / 0.4; // Widened x radius
    const dy = (normY - noseCenterY) / 0.4; // Widened y radius
    const distFromNose = Math.sqrt(dx*dx + dy*dy);
    
    // Smooth falloff
    const maxNoseDistance = 1.8;
    const noseFalloff = Math.max(0, 1 - (distFromNose / maxNoseDistance));
    const noseWeight = noseFalloff * noseFalloff * noseFalloff * (noseFalloff * (noseFalloff * 6 - 15) + 10);
    
    // Apply nose transformations
    if (sliderValues.noseWidth) {
      displacementX += (sliderValues.noseWidth / 100) * normX * amplificationFactor * 1.8 * noseWeight;
    }
    
    if (sliderValues.noseLength) {
      displacementY += (sliderValues.noseLength / 100) * (normY > 0 ? 1 : -1) * amplificationFactor * 1.8 * noseWeight;
    }
  }
  
  // Mouth region with elliptical influence
  {
    // Elliptical distance calculation
    const mouthCenterY = 0.25;
    const dx = normX / 0.5;
    const dy = (normY - mouthCenterY) / 0.4;
    const distFromMouth = Math.sqrt(dx*dx + dy*dy);
    
    // Smooth falloff
    const maxMouthDistance = 1.8;
    const mouthFalloff = Math.max(0, 1 - (distFromMouth / maxMouthDistance));
    const mouthWeight = mouthFalloff * mouthFalloff * mouthFalloff * (mouthFalloff * (mouthFalloff * 6 - 15) + 10);
    
    // Apply mouth transformations
    if (sliderValues.mouthWidth) {
      displacementX += (sliderValues.mouthWidth / 100) * normX * amplificationFactor * 1.9 * mouthWeight;
    }
    
    if (sliderValues.mouthHeight) {
      displacementY += (sliderValues.mouthHeight / 100) * (normY - mouthCenterY) * amplificationFactor * 1.9 * mouthWeight;
    }
  }
  
  // Face width using global radial gradient with emphasis on edges
  {
    // Use smooth sigmoid-like falloff that emphasizes edges
    const targetDist = 0.8; // Distance where effect is strongest
    const sharpness = 3.0; // How sharp the transition is
    const faceFalloff = 1.0 / (1.0 + Math.exp(-(distFromCenter - targetDist) * sharpness));
    
    if (sliderValues.faceWidth) {
      displacementX += (sliderValues.faceWidth / 100) * normX * amplificationFactor * 1.8 * faceFalloff;
    }
  }
  
  // Chin shape with improved elliptical influence
  {
    // Elliptical distance from chin center
    const chinCenterY = 0.5;
    const dx = normX / 0.4;
    const dy = (normY - chinCenterY) / 0.4;
    const distFromChin = Math.sqrt(dx*dx + dy*dy);
    
    // Smooth falloff
    const maxChinDistance = 2.0;
    const chinFalloff = Math.max(0, 1 - (distFromChin / maxChinDistance));
    const chinWeight = chinFalloff * chinFalloff * chinFalloff * (chinFalloff * (chinFalloff * 6 - 15) + 10);
    
    // Apply chin shape transformation
    if (sliderValues.chinShape) {
      displacementY += (sliderValues.chinShape / 100) * (normY - 0.4) * amplificationFactor * 2.0 * chinWeight;
    }
  }
  
  // Jawline with improved angular weighting
  {
    // Create a weight based on both distance from center and angle to focus on jaw areas
    const jawCenterY = 0.35;
    const angle = Math.atan2(normY - jawCenterY, normX);
    const angleFactor = Math.abs(Math.cos(angle)); // Peaks at sides of face
    
    // Create a radial distance factor that's stronger at the edges
    const jawDistance = Math.sqrt(normX*normX + (normY-jawCenterY)*(normY-jawCenterY));
    const distanceFactor = Math.min(1, jawDistance / 0.7);
    
    // Combine angle and distance for jaw-specific weighting
    const jawWeight = distanceFactor * angleFactor;
    
    // Add a smooth falloff to avoid any discontinuities
    const smoothJawWeight = jawWeight * (3 * jawWeight - 2 * jawWeight * jawWeight);
    
    if (sliderValues.jawline) {
      const direction = normX > 0 ? 1 : -1;
      displacementX += (sliderValues.jawline / 100) * direction * amplificationFactor * 2.0 * smoothJawWeight;
    }
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
