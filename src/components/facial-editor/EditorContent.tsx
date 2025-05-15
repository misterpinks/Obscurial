
import React, { RefObject } from 'react';
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";
import ImagePreview from './ImagePreview';
import FaceAnalysis from './FaceAnalysis';
import AdjustmentSliders from './AdjustmentSliders';
import RandomizeButton from './RandomizeButton';
import EditorImageControls from './EditorImageControls';
import FaceMirrorControls from './FaceMirrorControls';

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
        
        {/* Analysis information below images - always show if we have an image */}
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
      <div className="space-y-4">
        <RandomizeButton onRandomize={onRandomizeSliders} />
        
        {/* Add Face Mirroring Controls with advanced options */}
        {onToggleMirror && onToggleMirrorSide && (
          <FaceMirrorControls
            mirrorEnabled={Boolean(sliderValues.mirrorFace) && sliderValues.mirrorFace > 0}
            mirrorSide={sliderValues.mirrorSide || 0}
            mirrorOffsetX={mirrorOffsetX}
            mirrorAngle={mirrorAngle}
            mirrorCutoffY={mirrorCutoffY}
            onToggleMirror={onToggleMirror}
            onToggleSide={onToggleMirrorSide}
            onOffsetChange={onMirrorOffsetChange}
            onOffsetChangeComplete={onMirrorOffsetChangeComplete}
            onAngleChange={onMirrorAngleChange}
            onAngleChangeComplete={onMirrorAngleChangeComplete}
            onCutoffChange={onMirrorCutoffChange}
            onCutoffChangeComplete={onMirrorCutoffChangeComplete}
          />
        )}
        
        <AdjustmentSliders 
          featureSliders={featureSliders}
          sliderValues={sliderValues}
          onSliderChange={onSliderChange}
          onSliderChangeComplete={onSliderChangeComplete}
          onReset={onResetSliders}
          faceMaskSelector={faceMaskSelector}
        />
      </div>
    </div>
  );
};

export default EditorContent;
