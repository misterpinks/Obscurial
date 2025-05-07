
/**
 * Types for transformation parameters
 */

// Face effect options interface
export interface FaceEffectOptions {
  effectType: 'blur' | 'pixelate' | 'mask' | 'none';
  effectIntensity: number;
  maskImage?: HTMLImageElement | null;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
}

// Parameters for transformation operations
export interface TransformationParams {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  width: number;
  height: number;
  faceDetection: any | null;
  sliderValues: Record<string, number>;
  faceEffectOptions?: FaceEffectOptions;
  worker?: Worker; // Optional Web Worker for improved performance
}

// Facial Region interface for region-based transformations
export interface FacialRegion {
  condition: (normX: number, normY: number, distFromCenter?: number) => boolean;
  transform: (normX: number, normY: number, sliderValues: Record<string, number>, amplificationFactor: number) => {
    displacementX: number;
    displacementY: number;
  };
}
