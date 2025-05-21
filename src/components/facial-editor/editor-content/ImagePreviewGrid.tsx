
import React, { RefObject } from 'react';
import ImagePreview from '../image-preview';
import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ImagePreviewGridProps {
  originalCanvasRef: RefObject<HTMLCanvasElement>;
  processedCanvasRef: RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: RefObject<HTMLCanvasElement>;
  originalImage: HTMLImageElement | null;
  isProcessing: boolean;
  isAnalyzing: boolean;
  faceDetection: any;
  showLandmarks: boolean;
  toggleLandmarks: () => void;
  handleLandmarkMove: (pointIndex: number, x: number, y: number) => void;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
  onMaskPositionChange?: (position: { x: number, y: number }) => void;
  onMaskScaleChange?: (scale: number) => void;
}

const ImagePreviewGrid: React.FC<ImagePreviewGridProps> = ({
  originalCanvasRef,
  processedCanvasRef,
  cleanProcessedCanvasRef,
  originalImage,
  isProcessing,
  isAnalyzing,
  faceDetection,
  showLandmarks,
  toggleLandmarks,
  handleLandmarkMove,
  maskPosition,
  maskScale,
  onMaskPositionChange,
  onMaskScaleChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ImagePreview 
        title="Original"
        canvasRef={originalCanvasRef}
        originalImage={originalImage}
      />
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Modified {showLandmarks ? 'with Landmarks' : ''}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs">{showLandmarks ? <Eye size={14} /> : <EyeOff size={14} />}</span>
            <Switch 
              checked={showLandmarks} 
              onCheckedChange={toggleLandmarks}
              size="sm"
            />
          </div>
        </div>
        <ImagePreview
          title=""
          canvasRef={processedCanvasRef}
          isProcessing={isProcessing}
          isAnalyzing={isAnalyzing}
          noFaceDetected={!faceDetection && !isAnalyzing && originalImage !== null}
          originalImage={originalImage}
          enableZoom={true}
          onLandmarkMove={handleLandmarkMove}
          faceDetection={faceDetection}
        />
      </div>
      
      <ImagePreview
        title="Clean Result"
        canvasRef={cleanProcessedCanvasRef}
        originalImage={originalImage}
        enableMaskControl={Boolean(faceDetection && onMaskPositionChange)}
        maskPosition={maskPosition}
        maskScale={maskScale}
        onMaskPositionChange={onMaskPositionChange}
        onMaskScaleChange={onMaskScaleChange}
        faceDetection={faceDetection}
      />
    </div>
  );
};

export default ImagePreviewGrid;
