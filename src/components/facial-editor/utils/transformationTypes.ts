
export interface TransformationParams {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  width: number;
  height: number;
  faceDetection: any;
  sliderValues: Record<string, number>;
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  };
}

// Define the FacialRegion interface for facial transformation regions
export interface FacialRegion {
  condition: (normX: number, normY: number, distFromCenter?: number) => boolean;
  transform: (normX: number, normY: number, sliderValues: Record<string, number>, amplificationFactor: number) => {
    displacementX: number;
    displacementY: number;
  };
}
