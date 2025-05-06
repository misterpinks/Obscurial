
import { FacialRegion } from './transformationTypes';

/**
 * Definitions of facial regions and their transformation logic
 */

// Amplification factor for transformations - significantly increased for more dramatic effects
const AMPLIFICATION_FACTOR = 3.5;

export const getFacialRegions = (): FacialRegion[] => [
  // Eye region - expanded with better blending
  {
    condition: (normX, normY) => 
      normY < -0.1 && normY > -0.7 && Math.abs(normX) > 0.05 && Math.abs(normX) < 0.5,
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      let displacementX = 0;
      let displacementY = 0;
      
      // Apply eye size transformation with increased effect
      displacementX += (sliderValues.eyeSize / 100) * normX * amplificationFactor;
      displacementY += (sliderValues.eyeSize / 100) * normY * amplificationFactor;
      
      // Apply eye spacing transformation with increased effect
      displacementX += (sliderValues.eyeSpacing / 100) * (normX > 0 ? 1 : -1) * amplificationFactor;
      
      return { displacementX, displacementY };
    }
  },
  
  // Eyebrow region - expanded and intensified
  {
    condition: (normX, normY) => 
      normY < -0.2 && normY > -0.8 && Math.abs(normX) > 0.05 && Math.abs(normX) < 0.5,
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      // Increased effect for eyebrow height
      const displacementY = -(sliderValues.eyebrowHeight / 100) * amplificationFactor * 1.25;
      return { displacementX: 0, displacementY };
    }
  },
  
  // Nose region - expanded with more dramatic effects and better blending
  {
    condition: (normX, normY) => 
      Math.abs(normX) < 0.35 && normY > -0.45 && normY < 0.3,
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      // Intensified nose transformations
      const displacementX = (sliderValues.noseWidth / 100) * normX * amplificationFactor * 1.5;
      const displacementY = (sliderValues.noseLength / 100) * (normY > 0 ? 1 : -1) * amplificationFactor * 1.2;
      return { displacementX, displacementY };
    }
  },
  
  // Mouth region - expanded with more dramatic effects
  {
    condition: (normX, normY) => 
      Math.abs(normX) < 0.4 && normY > 0.0 && normY < 0.5,
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      // Intensified mouth transformations
      const displacementX = (sliderValues.mouthWidth / 100) * normX * amplificationFactor * 1.5;
      const displacementY = (sliderValues.mouthHeight / 100) * (normY - 0.25) * amplificationFactor * 1.3;
      return { displacementX, displacementY };
    }
  },
  
  // Overall face width - expanded with more dramatic effect
  {
    condition: (normX, normY, distFromCenter) => 
      distFromCenter > 0.35 && distFromCenter < 1.3,
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      // More dramatic face width transformation
      const displacementX = (sliderValues.faceWidth / 100) * normX * amplificationFactor * 1.4;
      return { displacementX, displacementY: 0 };
    }
  },
  
  // Chin shape - expanded with more dramatic effect
  {
    condition: (normX, normY) => 
      normY > 0.3 && Math.abs(normX) < 0.45,
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      // More dramatic chin shape transformation
      const displacementY = (sliderValues.chinShape / 100) * (normY - 0.4) * amplificationFactor * 1.6;
      return { displacementX: 0, displacementY };
    }
  },
  
  // Jawline - expanded with more dramatic effect
  {
    condition: (normX, normY) => 
      normY > 0.1 && Math.abs(normX) > 0.2 && Math.abs(normX) < 0.7,
    transform: (normX, normY, sliderValues, amplificationFactor) => {
      // More dramatic jawline transformation
      const displacementX = (sliderValues.jawline / 100) * (normX > 0 ? 1 : -1) * amplificationFactor * 1.5;
      return { displacementX, displacementY: 0 };
    }
  }
];

// Helper function to get amplification factor
export const getAmplificationFactor = () => AMPLIFICATION_FACTOR;
