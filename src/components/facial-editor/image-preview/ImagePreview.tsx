
import React, { useRef } from 'react';
import { drawFaceLandmarks } from '../utils/landmarkVisualization';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ControlTips from './ControlTips';
import { useCanvasInteraction } from './useCanvasInteraction';
import { useCanvasContentDetection } from './useCanvasContentDetection';

interface ImagePreviewProps {
  title: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  originalImage?: HTMLImageElement | null;
  isProcessing?: boolean;
  isAnalyzing?: boolean;
  noFaceDetected?: boolean;
  enableZoom?: boolean;
  enableMaskControl?: boolean;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
  onMaskPositionChange?: (position: { x: number, y: number }) => void;
  onMaskScaleChange?: (scale: number) => void;
  onLandmarkMove?: (pointIndex: number, x: number, y: number) => void;
  faceDetection?: any;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  title,
  canvasRef,
  originalImage,
  isProcessing,
  isAnalyzing,
  noFaceDetected,
  enableZoom = false,
  enableMaskControl = false,
  maskPosition,
  maskScale,
  onMaskPositionChange,
  onMaskScaleChange,
  onLandmarkMove,
  faceDetection
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks for canvas interaction and content detection
  const { isShowingCanvas } = useCanvasContentDetection(
    canvasRef, 
    originalImage, 
    isProcessing, 
    isAnalyzing
  );
  
  const { 
    scale, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    handleMouseLeave 
  } = useCanvasInteraction(
    canvasRef,
    enableZoom,
    faceDetection,
    maskPosition,
    onMaskPositionChange,
    onMaskScaleChange,
    onLandmarkMove,
    maskScale
  );

  return (
    <div className="relative rounded-lg border overflow-hidden h-48 md:h-64 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {title && <h3 className="text-sm font-medium absolute top-2 left-2 z-10 bg-white/80 dark:bg-black/80 px-2 py-1 rounded">{title}</h3>}
      
      <div 
        ref={containerRef}
        className={`relative flex-grow flex items-center justify-center overflow-hidden ${enableZoom ? 'cursor-move' : ''}`}
      >
        {/* Loading indicators */}
        <LoadingState isProcessing={isProcessing} isAnalyzing={isAnalyzing} />
        
        {/* Empty state and no face detected message */}
        <EmptyState 
          noFaceDetected={noFaceDetected}
          isShowingCanvas={isShowingCanvas}
          isProcessing={isProcessing}
          isAnalyzing={isAnalyzing}
          originalImage={originalImage}
        />
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className={`max-h-full max-w-full object-contain transition-opacity ${isShowingCanvas ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: `scale(${scale})`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      
      <ControlTips enableZoom={enableZoom} enableMaskControl={enableMaskControl} />
    </div>
  );
};

export default ImagePreview;
