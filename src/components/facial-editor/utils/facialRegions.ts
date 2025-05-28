
/**
 * Configuration for facial regions and transformation parameters
 */

import { FacialRegion } from './transformationTypes';

// Base amplification factor for transformations
export const getAmplificationFactor = (): number => {
  return 4.0; // Increased for more dramatic effects
};

// Define regions of the face that can be transformed
export const facialRegions: FacialRegion[] = [
  // Eye region - ENLARGED region with smoother boundaries
  {
    condition: (normX, normY) => Math.abs(normY + 0.25) < 0.28 && Math.abs(normX) < 0.5,
    transform: (normX, normY, sliderValues, amplification) => {
      const eyeSizeX = (sliderValues.eyeSize || 0) / 100 * normX * amplification;
      const eyeSizeY = (sliderValues.eyeSize || 0) / 100 * normY * amplification;
      const eyeSpacingX = (sliderValues.eyeSpacing || 0) / 100 * (normX > 0 ? 1 : -1) * amplification;
      
      return {
        displacementX: eyeSizeX + eyeSpacingX,
        displacementY: eyeSizeY
      };
    }
  },
  
  // Eyebrow region - ENLARGED
  {
    condition: (normX, normY) => Math.abs(normY + 0.4) < 0.15 && Math.abs(normX) < 0.5,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: 0,
        displacementY: -(sliderValues.eyebrowHeight || 0) / 100 * amplification * 1.5
      };
    }
  },
  
  // Nose region - ENLARGED
  {
    condition: (normX, normY) => Math.abs(normX) < 0.25 && normY > -0.35 && normY < 0.25,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: (sliderValues.noseWidth || 0) / 100 * normX * amplification * 1.3,
        displacementY: (sliderValues.noseLength || 0) / 100 * (normY > 0 ? 1 : -1) * amplification * 1.3
      };
    }
  },
  
  // Mouth region - ENLARGED
  {
    condition: (normX, normY) => Math.abs(normX) < 0.4 && normY > 0.05 && normY < 0.45,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: (sliderValues.mouthWidth || 0) / 100 * normX * amplification * 1.4,
        displacementY: (sliderValues.mouthHeight || 0) / 100 * (normY - 0.25) * amplification * 1.4
      };
    }
  },
  
  // Face width - expanded
  {
    condition: (normX, normY, distFromCenter) => {
      return distFromCenter !== undefined && distFromCenter > 0.35 && distFromCenter < 1.2;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: (sliderValues.faceWidth || 0) / 100 * normX * amplification * 1.3,
        displacementY: 0
      };
    }
  },
  
  // Chin shape - enlarged
  {
    condition: (normX, normY) => normY > 0.25 && Math.abs(normX) < 0.4,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: 0,
        displacementY: (sliderValues.chinShape || 0) / 100 * (normY - 0.4) * amplification * 1.5
      };
    }
  },
  
  // Jawline - enlarged
  {
    condition: (normX, normY) => normY > 0.1 && Math.abs(normX) > 0.15 && Math.abs(normX) < 0.7,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: (sliderValues.jawline || 0) / 100 * (normX > 0 ? 1 : -1) * amplification * 1.3,
        displacementY: 0
      };
    }
  }
];

// Get displacements for a specific point on the face
export const getDisplacement = (
  normX: number, 
  normY: number,
  distFromCenter: number,
  sliderValues: Record<string, number>,
  amplificationFactor: number
) => {
  let totalDisplacementX = 0;
  let totalDisplacementY = 0;
  
  // Apply transformations from all regions that match the current point
  facialRegions.forEach(region => {
    if (region.condition(normX, normY, distFromCenter)) {
      const { displacementX, displacementY } = region.transform(
        normX, normY, sliderValues, amplificationFactor
      );
      
      totalDisplacementX += displacementX;
      totalDisplacementY += displacementY;
    }
  });
  
  return { displacementX: totalDisplacementX, displacementY: totalDisplacementY };
};
