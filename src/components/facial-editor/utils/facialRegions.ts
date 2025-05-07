
/**
 * Configuration for facial regions and transformation parameters
 */

import { FacialRegion } from './transformationTypes';

// Base amplification factor for transformations
export const getAmplificationFactor = (): number => {
  return 2.0; // Default base amplification factor
};

// Define regions of the face that can be transformed
export const facialRegions: FacialRegion[] = [
  // Eye region
  {
    condition: (normX, normY) => Math.abs(normY + 0.25) < 0.2 && Math.abs(normX) < 0.4,
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
  
  // Eyebrow region
  {
    condition: (normX, normY) => Math.abs(normY + 0.4) < 0.1 && Math.abs(normX) < 0.4,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: 0,
        displacementY: -(sliderValues.eyebrowHeight || 0) / 100 * amplification
      };
    }
  },
  
  // Nose region
  {
    condition: (normX, normY) => Math.abs(normX) < 0.2 && normY > -0.3 && normY < 0.2,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: (sliderValues.noseWidth || 0) / 100 * normX * amplification,
        displacementY: (sliderValues.noseLength || 0) / 100 * (normY > 0 ? 1 : -1) * amplification
      };
    }
  },
  
  // Mouth region
  {
    condition: (normX, normY) => Math.abs(normX) < 0.3 && normY > 0.1 && normY < 0.4,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: (sliderValues.mouthWidth || 0) / 100 * normX * amplification,
        displacementY: (sliderValues.mouthHeight || 0) / 100 * (normY - 0.25) * amplification
      };
    }
  },
  
  // Face width
  {
    condition: (normX, normY, distFromCenter) => {
      return distFromCenter !== undefined && distFromCenter > 0.4 && distFromCenter < 1.0;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: (sliderValues.faceWidth || 0) / 100 * normX * amplification,
        displacementY: 0
      };
    }
  },
  
  // Chin shape
  {
    condition: (normX, normY) => normY > 0.3 && Math.abs(normX) < 0.3,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: 0,
        displacementY: (sliderValues.chinShape || 0) / 100 * (normY - 0.4) * amplification
      };
    }
  },
  
  // Jawline
  {
    condition: (normX, normY) => normY > 0.15 && Math.abs(normX) > 0.2 && Math.abs(normX) < 0.6,
    transform: (normX, normY, sliderValues, amplification) => {
      return {
        displacementX: (sliderValues.jawline || 0) / 100 * (normX > 0 ? 1 : -1) * amplification,
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
