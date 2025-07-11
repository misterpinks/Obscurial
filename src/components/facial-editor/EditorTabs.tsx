
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, ImageIcon } from "lucide-react";
import EditorContent from './EditorContent';
import ImageUploader from './ImageUploader';
import WebcamCapture from './WebcamCapture';
import FacialRecognitionResources from './FacialRecognitionResources';

interface FacialTelemetryDelta {
  overallDistance: number;
  eyeDistances: {
    leftEye: number;
    rightEye: number;
    eyeSpacing: number;
  };
  noseChanges: {
    width: number;
    length: number;
    position: number;
  };
  mouthChanges: {
    width: number;
    height: number;
    position: number;
  };
  faceShape: {
    width: number;
    jawline: number;
    chin: number;
  };
  confidenceChange: number;
}

interface EditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  originalImage: HTMLImageElement | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  onCapture: () => HTMLImageElement | null;
  streamRef: React.RefObject<MediaStream>;
  originalCanvasRef: React.RefObject<HTMLCanvasElement>;
  processedCanvasRef: React.RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>;
  isProcessing: boolean;
  isAnalyzing: boolean;
  faceDetection: any;
  facialDifference: number | null;
  imageDimensions: { width: number; height: number } | null;
  triggerFileInput: () => void;
  downloadImage: () => void;
  hasProcessedImage: boolean;
  handleRunAnalysis: () => void;
  featureSliders: any[];
  sliderValues: Record<string, number>;
  onSliderChange: (id: string, value: number) => void;
  onSliderChangeComplete: () => void;
  onResetSliders: () => void;
  onRandomizeSliders: () => void;
  showLandmarks: boolean;
  toggleLandmarks: () => void;
  handleLandmarkMove: (index: number, x: number, y: number) => void;
  autoAnalyze: boolean;
  onToggleAutoAnalyze: () => void;
  maskPosition: { x: number; y: number };
  maskScale: number;
  onMaskPositionChange: (pos: { x: number; y: number }) => void;
  onMaskScaleChange: (scale: number) => void;
  faceMaskSelector: React.ReactNode;
  presetsComponent: React.ReactNode;
  facialTelemetryDelta: FacialTelemetryDelta | null;
}

const EditorTabs = ({
  activeTab,
  onTabChange,
  originalImage,
  handleImageUpload,
  fileInputRef,
  videoRef,
  onCapture,
  streamRef,
  originalCanvasRef,
  processedCanvasRef,
  cleanProcessedCanvasRef,
  isProcessing,
  isAnalyzing,
  faceDetection,
  facialDifference,
  imageDimensions,
  triggerFileInput,
  downloadImage,
  hasProcessedImage,
  handleRunAnalysis,
  featureSliders,
  sliderValues,
  onSliderChange,
  onSliderChangeComplete,
  onResetSliders,
  onRandomizeSliders,
  showLandmarks,
  toggleLandmarks,
  handleLandmarkMove,
  autoAnalyze,
  onToggleAutoAnalyze,
  maskPosition,
  maskScale,
  onMaskPositionChange,
  onMaskScaleChange,
  faceMaskSelector,
  presetsComponent,
  facialTelemetryDelta,
}: EditorTabsProps) => {

  return (
    <Tabs defaultValue="upload" value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
        <TabsTrigger value="upload" onClick={() => onTabChange("upload")}>
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </TabsTrigger>
        <TabsTrigger value="webcam" onClick={() => onTabChange("webcam")}>
          <Camera className="h-4 w-4 mr-2" />
          Webcam
        </TabsTrigger>
        <TabsTrigger value="edit" onClick={() => onTabChange("edit")} disabled={!originalImage}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Edit
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="flex flex-col items-center justify-center">
        <ImageUploader
          onImageUpload={handleImageUpload}
          inputRef={fileInputRef}
          triggerFileInput={triggerFileInput}
        />
      </TabsContent>

      <TabsContent value="webcam" className="flex flex-col items-center justify-center">
        <WebcamCapture
          videoRef={videoRef}
          onCapture={onCapture}
          streamRef={streamRef}
        />
      </TabsContent>

      <TabsContent value="edit">
        <div className="space-y-8">
          <EditorContent
            originalCanvasRef={originalCanvasRef}
            processedCanvasRef={processedCanvasRef}
            cleanProcessedCanvasRef={cleanProcessedCanvasRef}
            isProcessing={isProcessing}
            isAnalyzing={isAnalyzing}
            faceDetection={faceDetection}
            facialDifference={facialDifference}
            imageDimensions={imageDimensions}
            triggerFileInput={triggerFileInput}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            downloadImage={downloadImage}
            hasProcessedImage={hasProcessedImage}
            handleRunAnalysis={handleRunAnalysis}
            showLandmarks={showLandmarks}
            toggleLandmarks={toggleLandmarks}
            handleLandmarkMove={handleLandmarkMove}
            autoAnalyze={autoAnalyze}
            onToggleAutoAnalyze={onToggleAutoAnalyze}
            featureSliders={featureSliders}
            sliderValues={sliderValues}
            onSliderChange={onSliderChange}
            onSliderChangeComplete={onSliderChangeComplete}
            onResetSliders={onResetSliders}
            onRandomizeSliders={onRandomizeSliders}
            maskPosition={maskPosition}
            maskScale={maskScale}
            onMaskPositionChange={onMaskPositionChange}
            onMaskScaleChange={onMaskScaleChange}
            faceMaskSelector={faceMaskSelector}
            originalImage={originalImage}
            facialTelemetryDelta={facialTelemetryDelta}
          />
          
          {/* Presets section */}
          {presetsComponent && (
            <div className="mb-4">
              {presetsComponent}
            </div>
          )}
          
          {/* Facial Recognition Resources at the bottom */}
          <div className="mt-8">
            <FacialRecognitionResources />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default EditorTabs;
