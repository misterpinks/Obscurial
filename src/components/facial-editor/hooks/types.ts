/**
 * Type definitions for face analysis hooks
 */

export interface FaceDetection {
  landmarks?: any;
  detection?: any;
  confidence?: number;
  original?: any;
  modified?: any;
}

export interface FaceDetectionResult {
  isAnalyzing: boolean;
  faceDetection: FaceDetection | null;
  setFaceDetection: (detection: FaceDetection | null) => void;
  detectFaces: () => Promise<void>;
  imageDimensions: { width: number; height: number };
}

export interface ModifiedFaceAnalysisResult {
  facialDifference: number | null;
  analyzeModifiedImage: () => Promise<void>;
}

export interface FaceAnalysisResult extends FaceDetectionResult, ModifiedFaceAnalysisResult {
  initialProcessingDone: boolean;
  setInitialProcessingDone: (value: boolean) => void;
  hasShownNoFaceToast: boolean;
  setHasShownNoFaceToast: (value: boolean) => void;
  autoAnalyze: boolean;
  toggleAutoAnalyze: () => void;
  lastProcessedValues: string;
  setLastProcessedValues: (value: string) => void;
}

// Add mask position and scale to face effect options
export interface FaceEffectOptions {
  effectType: 'blur' | 'pixelate' | 'mask' | 'none';
  effectIntensity: number;
  maskImage?: HTMLImageElement | null;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
}
