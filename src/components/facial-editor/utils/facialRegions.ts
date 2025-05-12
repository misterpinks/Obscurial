
/**
 * Configuration for facial regions and transformation parameters
 * Completely revamped to use circular/elliptical regions with extensive overlap
 */

import { FacialRegion } from './transformationTypes';

// Significantly increased base amplification factor for more dramatic effects
export function getAmplificationFactor(): number {
  return 7.0; // Dramatically increased for more pronounced effects (from 5.0)
}

// Define regions of the face using overlapping circular/elliptical areas
export const facialRegions: FacialRegion[] = [
  // Eye region - now using circular boundaries with extensive overlap
  {
    condition: (normX, normY) => {
      // Use elliptical distance calculation for eye region
      const eyeCenterX = Math.abs(normX) > 0.2 ? (normX > 0 ? 0.3 : -0.3) : 0;
      const eyeCenterY = -0.25;
      
      // Elliptical distance calculation with very gradual falloff
      const dx = (normX - eyeCenterX) / 0.8; // Widened x radius significantly
      const dy = (normY - eyeCenterY) / 0.6; // Widened y radius significantly
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Very large influence area to eliminate edge artifacts
      return dist < 1.5;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      // Use multiple eye centers for left and right eyes with smooth transitions
      const eyeCenterX = normX > 0 ? 0.3 : -0.3;
      const eyeCenterY = -0.25;
      
      // Calculate distance from eye center with elliptical weighting
      const dx = (normX - eyeCenterX) / 0.4;
      const dy = (normY - eyeCenterY) / 0.3;
      const distFromEyeCenter = Math.sqrt(dx*dx + dy*dy);
      
      // Create super smooth falloff factor with cubic easing
      const falloff = Math.max(0, 1 - (distFromEyeCenter / 1.5));
      // Enhanced cubic smoothstep for ultra-smooth transitions
      const smoothFalloff = falloff * falloff * falloff * (falloff * (falloff * 6 - 15) + 10);
      
      // Calculate transformations
      const eyeSizeX = (sliderValues.eyeSize || 0) / 100 * normX * amplification * smoothFalloff;
      const eyeSizeY = (sliderValues.eyeSize || 0) / 100 * normY * amplification * smoothFalloff;
      const eyeSpacingX = (sliderValues.eyeSpacing || 0) / 100 * (normX > 0 ? 1 : -1) * amplification * smoothFalloff;
      
      return {
        displacementX: eyeSizeX + eyeSpacingX,
        displacementY: eyeSizeY
      };
    }
  },
  
  // Eyebrow region - using elliptical boundaries with extensive overlap
  {
    condition: (normX, normY) => {
      // Elliptical distance calculation for eyebrow region
      const eyebrowCenterX = normX > 0 ? 0.3 : -0.3;
      const eyebrowCenterY = -0.4;
      
      // Use wide elliptical boundary
      const dx = (normX - eyebrowCenterX) / 0.8;
      const dy = (normY - eyebrowCenterY) / 0.5;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      return dist < 1.5;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      // Calculate eyebrow center based on x position
      const eyebrowCenterX = normX > 0 ? 0.3 : -0.3;
      const eyebrowCenterY = -0.4;
      
      // Calculate distance from eyebrow center
      const dx = (normX - eyebrowCenterX) / 0.4;
      const dy = (normY - eyebrowCenterY) / 0.25;
      const distFromCenter = Math.sqrt(dx*dx + dy*dy);
      
      // Create super smooth falloff
      const falloff = Math.max(0, 1 - (distFromCenter / 1.5));
      // Enhanced quintic smoothstep for ultra-smooth transitions
      const smoothFalloff = falloff * falloff * falloff * (falloff * (falloff * 6 - 15) + 10);
      
      return {
        displacementX: 0,
        displacementY: -(sliderValues.eyebrowHeight || 0) / 100 * amplification * 2.2 * smoothFalloff
      };
    }
  },
  
  // Nose region - now using circular boundary with gradual falloff
  {
    condition: (normX, normY) => {
      // Circular distance from nose center
      const noseCenterY = 0;
      const dx = normX / 0.8; // Widened x radius significantly
      const dy = (normY - noseCenterY) / 0.8; // Widened y radius
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Very large influence area
      return dist < 1.8;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      // Calculate distance from nose center
      const noseCenterY = 0;
      const dx = normX / 0.4;
      const dy = (normY - noseCenterY) / 0.4;
      const distFromCenter = Math.sqrt(dx*dx + dy*dy);
      
      // Create super smooth falloff with enhanced cubic easing
      const falloff = Math.max(0, 1 - (distFromCenter / 1.8));
      const smoothFalloff = falloff * falloff * falloff * (falloff * (falloff * 6 - 15) + 10);
      
      return {
        displacementX: (sliderValues.noseWidth || 0) / 100 * normX * amplification * 1.8 * smoothFalloff,
        displacementY: (sliderValues.noseLength || 0) / 100 * (normY > 0 ? 1 : -1) * amplification * 1.8 * smoothFalloff
      };
    }
  },
  
  // Mouth region - circular with extensive overlap
  {
    condition: (normX, normY) => {
      // Elliptical distance from mouth center
      const mouthCenterY = 0.25;
      const dx = normX / 0.9; // Widened x radius significantly
      const dy = (normY - mouthCenterY) / 0.7; // Widened y radius
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Very large influence area
      return dist < 1.8;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      // Calculate distance from mouth center
      const mouthCenterY = 0.25;
      const dx = normX / 0.5;
      const dy = (normY - mouthCenterY) / 0.4;
      const distFromCenter = Math.sqrt(dx*dx + dy*dy);
      
      // Create super smooth falloff with enhanced cubic easing
      const falloff = Math.max(0, 1 - (distFromCenter / 1.8));
      const smoothFalloff = falloff * falloff * falloff * (falloff * (falloff * 6 - 15) + 10);
      
      return {
        displacementX: (sliderValues.mouthWidth || 0) / 100 * normX * amplification * 1.9 * smoothFalloff,
        displacementY: (sliderValues.mouthHeight || 0) / 100 * (normY - mouthCenterY) * amplification * 1.9 * smoothFalloff
      };
    }
  },
  
  // Face width - using radial distance with extensive overlap for smooth transitions
  {
    condition: (normX, normY, distFromCenter) => {
      // Use a very wide area of influence that covers entire face
      return true;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      // Calculate distance from center
      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      
      // Create smooth falloff that emphasizes edges but has no hard boundaries
      // Use sigmoid-like falloff for ultra-smooth transitions
      const targetDist = 0.8; // Distance where effect is strongest
      const falloff = 1.0 / (1.0 + Math.exp(-(distFromCenter - targetDist) * 3));
      
      // Circular gradient with no hard edges
      return {
        displacementX: (sliderValues.faceWidth || 0) / 100 * normX * amplification * 1.8 * falloff,
        displacementY: 0
      };
    }
  },
  
  // Chin shape - circular with extensive overlap
  {
    condition: (normX, normY) => {
      // Elliptical distance from chin center
      const chinCenterY = 0.5;
      const dx = normX / 0.8; // Widened x radius
      const dy = (normY - chinCenterY) / 0.8; // Widened y radius
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Very large influence area
      return dist < 2.0;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      // Calculate distance from chin center
      const chinCenterY = 0.5;
      const dx = normX / 0.4;
      const dy = (normY - chinCenterY) / 0.4;
      const distFromCenter = Math.sqrt(dx*dx + dy*dy);
      
      // Create super smooth falloff with enhanced cubic easing
      const falloff = Math.max(0, 1 - (distFromCenter / 2.0));
      const smoothFalloff = falloff * falloff * falloff * (falloff * (falloff * 6 - 15) + 10);
      
      return {
        displacementX: 0,
        displacementY: (sliderValues.chinShape || 0) / 100 * (normY - 0.4) * amplification * 2.0 * smoothFalloff
      };
    }
  },
  
  // Jawline - using elliptical boundaries for smooth transitions
  {
    condition: (normX, normY) => {
      // Use multiple elliptical centers for smooth jawline
      const jawCenterX = normX > 0 ? 0.5 : -0.5;
      const jawCenterY = 0.3;
      
      // Wide elliptical boundary
      const dx = (normX - jawCenterX) / 0.9;
      const dy = (normY - jawCenterY) / 0.9;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      return dist < 1.8;
    },
    transform: (normX, normY, sliderValues, amplification) => {
      // Calculate jaw center based on x position
      const jawCenterX = normX > 0 ? 0.5 : -0.5;
      const jawCenterY = 0.3;
      
      // Calculate distance from jaw center
      const dx = (normX - jawCenterX) / 0.5;
      const dy = (normY - jawCenterY) / 0.5;
      const distFromCenter = Math.sqrt(dx*dx + dy*dy);
      
      // Create super smooth falloff
      const falloff = Math.max(0, 1 - (distFromCenter / 1.8));
      const smoothFalloff = falloff * falloff * falloff * (falloff * (falloff * 6 - 15) + 10);
      
      return {
        displacementX: (sliderValues.jawline || 0) / 100 * (normX > 0 ? 1 : -1) * amplification * 1.8 * smoothFalloff,
        displacementY: 0
      };
    }
  }
];

// Enhanced function to get displacement for a specific point with blending
export const getDisplacement = (
  normX: number, 
  normY: number,
  distFromCenter: number,
  sliderValues: Record<string, number>,
  amplificationFactor: number
) => {
  let totalDisplacementX = 0;
  let totalDisplacementY = 0;
  let totalWeight = 0;
  
  // Apply transformations from all regions that match the current point
  facialRegions.forEach(region => {
    if (region.condition(normX, normY, distFromCenter)) {
      const { displacementX, displacementY } = region.transform(
        normX, normY, sliderValues, amplificationFactor
      );
      
      // Accumulate displacements
      totalDisplacementX += displacementX;
      totalDisplacementY += displacementY;
      totalWeight += 1;
    }
  });
  
  // Ensure we don't divide by zero
  if (totalWeight === 0) {
    return { displacementX: 0, displacementY: 0 };
  }
  
  // Return weighted average displacement
  return { 
    displacementX: totalDisplacementX, 
    displacementY: totalDisplacementY 
  };
};
