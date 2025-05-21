
import React, { RefObject } from 'react';
import ImagePreviewGrid from './ImagePreviewGrid';
import AdjustmentControlsSection from './AdjustmentControlsSection';
import FaceAnalysis from '../FaceAnalysis';
import EditorImageControls from '../EditorImageControls';

interface EditorContentProps {
  originalCanvasRef: RefObject<HTMLCanvasElement>;
  processedCanvasRef: RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: RefObject<HTMLCanvasElement>;
  originalImage: HTMLImageElement | null;
  isProcessing: boolean;
  isAnalyzing: boolean;
  faceDetection: any;
  facialDifference: number | null;
  imageDimensions: { width: number; height: number } | null;
  triggerFileInput: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadImage: () => void;
  hasProcessedImage: boolean;
  handleRunAnalysis: () => void;
  showLandmarks: boolean;
  toggleLandmarks: () => void;
  featureSliders: any[];
  sliderValues: Record<string, number>;
  onSliderChange: (id: string, value: number) => void;
  onSliderChangeComplete?: () => void;
  onResetSliders: () => void;
  onRandomizeSliders: () => void;
  handleLandmarkMove: (pointIndex: number, x: number, y: number) => void;
  autoAnalyze?: boolean;
  onToggleAutoAnalyze?: () => void;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
  onMaskPositionChange?: (newPosition: { x: number, y: number }) => void;
  onMaskScaleChange?: (newScale: number) => void;
  faceMaskSelector?: React.ReactNode;
  onToggleMirror?: () => void;
  onToggleMirrorSide?: () => void;
  mirrorOffsetX?: number;
  mirrorAngle?: number;
  mirrorCutoffY?: number;
  onMirrorOffsetChange?: (value: number) => void;
  onMirrorOffsetChangeComplete?: () => void;
  onMirrorAngleChange?: (value: number) => void;
  onMirrorAngleChangeComplete?: () => void;
  onMirrorCutoffChange?: (value: number) => void;
  onMirrorCutoffChangeComplete?: () => void;
}

const EditorContent: React.FC<EditorContentProps> = ({
  originalCanvasRef,
  processedCanvasRef,
  cleanProcessedCanvasRef,
  originalImage,
  isProcessing,
  isAnalyzing,
  faceDetection,
  facialDifference,
  imageDimensions,
  triggerFileInput,
  fileInputRef,
  handleImageUpload,
  downloadImage,
  hasProcessedImage,
  handleRunAnalysis,
  showLandmarks,
  toggleLandmarks,
  featureSliders,
  sliderValues,
  onSliderChange,
  onSliderChangeComplete,
  onResetSliders,
  onRandomizeSliders,
  handleLandmarkMove,
  autoAnalyze = false,
  onToggleAutoAnalyze,
  maskPosition,
  maskScale,
  onMaskPositionChange,
  onMaskScaleChange,
  faceMaskSelector,
  onToggleMirror,
  onToggleMirrorSide,
  mirrorOffsetX = 0,
  mirrorAngle = 0,
  mirrorCutoffY = 1,
  onMirrorOffsetChange,
  onMirrorOffsetChangeComplete,
  onMirrorAngleChange,
  onMirrorAngleChangeComplete,
  onMirrorCutoffChange,
  onMirrorCutoffChangeComplete
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side - original, processed with landmarks, and clean images */}
      <div className="lg:col-span-2 space-y-6">
        <ImagePreviewGrid
          originalCanvasRef={originalCanvasRef}
          processedCanvasRef={processedCanvasRef}
          cleanProcessedCanvasRef={cleanProcessedCanvasRef}
          originalImage={originalImage}
          isProcessing={isProcessing}
          isAnalyzing={isAnalyzing}
          faceDetection={faceDetection}
          showLandmarks={showLandmarks}
          toggleLandmarks={toggleLandmarks}
          handleLandmarkMove={handleLandmarkMove}
          maskPosition={maskPosition}
          maskScale={maskScale}
          onMaskPositionChange={onMaskPositionChange}
          onMaskScaleChange={onMaskScaleChange}
        />
        
        {/* Analysis information below images */}
        <FaceAnalysis 
          confidence={faceDetection?.confidence} 
          facialDifference={facialDifference}
          isAnalyzing={isAnalyzing}
          onRunAnalysis={handleRunAnalysis}
          imageDimensions={imageDimensions}
          autoAnalyze={autoAnalyze}
          onToggleAutoAnalyze={onToggleAutoAnalyze}
        />
        
        <EditorImageControls
          triggerFileInput={triggerFileInput}
          fileInputRef={fileInputRef}
          handleImageUpload={handleImageUpload}
          downloadImage={downloadImage}
          hasProcessedImage={hasProcessedImage}
        />
      </div>
      
      {/* Right side - adjustment sliders */}
      <AdjustmentControlsSection
        featureSliders={featureSliders}
        sliderValues={sliderValues}
        onSliderChange={onSliderChange}
        onSliderChangeComplete={onSliderChangeComplete}
        onResetSliders={onResetSliders}
        onRandomizeSliders={onRandomizeSliders}
        faceMaskSelector={faceMaskSelector}
        onToggleMirror={onToggleMirror}
        onToggleMirrorSide={onToggleMirrorSide}
        mirrorOffsetX={mirrorOffsetX}
        mirrorAngle={mirrorAngle}
        mirrorCutoffY={mirrorCutoffY}
        onMirrorOffsetChange={onMirrorOffsetChange}
        onMirrorOffsetChangeComplete={onMirrorOffsetChangeComplete}
        onMirrorAngleChange={onMirrorAngleChange}
        onMirrorAngleChangeComplete={onMirrorAngleChangeComplete}
        onMirrorCutoffChange={onMirrorCutoffChange}
        onMirrorCutoffChangeComplete={onMirrorCutoffChangeComplete}
      />
    </div>
  );
};

export default EditorContent;
