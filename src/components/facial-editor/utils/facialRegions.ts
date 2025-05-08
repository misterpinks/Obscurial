
/**
 * Configuration for facial regions and transformation parameters
 */

import { FacialRegion } from './transformationTypes';

// Base amplification factor for transformations
export function getAmplificationFactor(): number {
  return 5.0; // Significantly increased for more dramatic effects (from 4.0)
}

// Define regions of the face that can be transformed
export const facialRegions: FacialRegion[] = [
  // Eye region - MASSIVELY enlarged region with smoother boundaries
  {
    condition: (normX, normY) => Math.abs(normY + 0.25) < 0.4 && Math.abs(normX) < 0.6,
    transform: (normX, normY, sliderValues, amplification) => {
      // Calculate distance from center of eye region
      const distFromEyeCenter = Math.sqrt(
        Math.pow(Math.abs(normX) - 0.25, 2) + 
        Math.pow(normY + 0.25, 2)
      );
      
      // Create smooth falloff factor
      const falloff = Math.max(0, 1 - (distFromEyeCenter / 0.4));
      const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
      
      const eyeSizeX = (sliderValues.eyeSize || 0) / 100 * normX * amplification * smoothFalloff;
      const eyeSizeY = (sliderValues.eyeSize || 0) / 100 * normY * amplification * smoothFalloff;
      const eyeSpacingX = (sliderValues.eyeSpacing || 0) / 100 * (normX > 0 ? 1 : -1) * amplification * smoothFalloff;
      
      return {
        displacementX: eyeSizeX + eyeSpacingX,
        displacementY: eyeSizeY
      };
    }
  },
  
  // Eyebrow region - MASSIVELY enlarged
  {
    condition: (normX, normY) => Math.abs(normY + 0.4) < 0.25 && Math.abs(normX) < 0.6,
    transform: (normX, normY, sliderValues, amplification) => {
      // Create smooth falloff from center of eyebrow
      const distFromEyebrowCenter = Math.sqrt(
        Math.pow(Math.abs(normX) - 0.25, 2) + 
        Math.pow(normY + 0.4, 2)
      );
      
      const falloff = Math.max(0, 1 - (distFromEyebrowCenter / 0.25));
      const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
      
      return {
        displacementX: 0,
        displacementY: -(sliderValues.eyebrowHeight || 0) / 100 * amplification * 1.8 * smoothFalloff
      };
    }
  },
  
  // Nose region - MASSIVELY enlarged
  {
    condition: (normX, normY) => Math.abs(normX) < 0.35 && normY > -0.45 && normY < 0.35,
    transform: (normX, normY, sliderValues, amplification) => {
      // Create smooth falloff from center of nose
      const distFromNoseCenter = Math.sqrt(
        Math.pow(normX, 2) + 
        Math.pow(normY - 0, 2)
      );
      
      const falloff = Math.max(0, 1 - (distFromNoseCenter / 0.4));
      const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
      
      return {
        displacementX: (sliderValues.noseWidth || 0) / 100 * normX * amplification * 1.5 * smoothFalloff,
        displacementY: (sliderValues.noseLength || 0) / 100 * (normY > 0 ? 1 : -1) * amplification * 1.5 * smoothFalloff
      };
    }
  },
  
  // Mouth region - MASSIVELY enlarged
  {
    condition: (normX, normY) => Math.abs(normX) < 0.5 && normY > -0.05 && normY < 0.55,
    transform: (normX, normY, sliderValues, amplification) => {
      // Create smooth falloff from center of mouth
      const distFromMouthCenter = Math.sqrt(
        Math.pow(normX, 2) + 
        Math.pow(normY - 0.25, 2)
      );
      
      const falloff = Math.max(0, 1 - (distFromMouthCenter / 0.5));
      const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
      
      return {
        displacementX: (sliderValues.mouthWidth || 0) / 100 * normX * amplification * 1.6 * smoothFalloff,
        displacementY: (sliderValues.mouthHeight || 0) / 100 * (normY - 0.25) * amplification * 1.6 * smoothFalloff
      };
    }
  },
  
  // Face width - dramatically expanded
  {
    condition: (normX, normY, distFromCenter) => {
      return distFromCenter !== undefined && distFromCenter > 0.25 && distFromCenter < 2.0;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      // Create smooth falloff based on distance from center
      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      const falloff = Math.max(0, 1 - Math.abs((distFromCenter - 0.75) / 1.25));
      const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
      
      return {
        displacementX: (sliderValues.faceWidth || 0) / 100 * normX * amplification * 1.5 * smoothFalloff,
        displacementY: 0
      };
    }
  },
  
  // Chin shape - massively enlarged
  {
    condition: (normX, normY) => normY > 0.15 && Math.abs(normX) < 0.6,
    transform: (normX, normY, sliderValues, amplification) => {
      // Create smooth falloff from center of chin
      const distFromChinCenter = Math.sqrt(
        Math.pow(normX, 2) + 
        Math.pow(normY - 0.5, 2)
      );
      
      const falloff = Math.max(0, 1 - (distFromChinCenter / 0.6));
      const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
      
      return {
        displacementX: 0,
        displacementY: (sliderValues.chinShape || 0) / 100 * (normY - 0.4) * amplification * 1.7 * smoothFalloff
      };
    }
  },
  
  // Jawline - massively enlarged
  {
    condition: (normX, normY) => normY > 0.0 && Math.abs(normX) > 0.1 && Math.abs(normX) < 0.9,
    transform: (normX, normY, sliderValues, amplification) => {
      // Create smooth falloff for jawline
      const jawCenter = 0.5; // Position along x-axis
      const jawCenterY = 0.3; // Position along y-axis
      
      const distFromJawCenter = Math.sqrt(
        Math.pow(Math.abs(normX) - jawCenter, 2) + 
        Math.pow(normY - jawCenterY, 2)
      );
      
      const falloff = Math.max(0, 1 - (distFromJawCenter / 0.8));
      const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
      
      return {
        displacementX: (sliderValues.jawline || 0) / 100 * (normX > 0 ? 1 : -1) * amplification * 1.5 * smoothFalloff,
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
