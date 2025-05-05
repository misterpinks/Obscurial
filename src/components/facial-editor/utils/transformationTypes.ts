
/**
 * Type definitions for facial transformations
 */

// Interface for the parameters of applyFeatureTransformations
export interface TransformationParams {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  width: number;
  height: number;
  faceDetection: any;
  sliderValues: Record<string, number>;
}

// Define regions for facial features used in transformations
export interface FacialRegion {
  condition: (normX: number, normY: number, distFromCenter: number) => boolean;
  transform: (
    normX: number, 
    normY: number, 
    sliderValues: Record<string, number>, 
    amplificationFactor: number
  ) => { displacementX: number; displacementY: number };
}
