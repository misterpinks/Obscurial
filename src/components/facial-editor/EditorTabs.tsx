
import React, { RefObject } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, ImageIcon } from "lucide-react";
import EditorContent from './EditorContent';
import ImageUploader from './ImageUploader';
import WebcamCapture from './WebcamCapture';
import FacialRecognitionResources from './FacialRecognitionResources';

interface EditorTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  originalImage: HTMLImageElement | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  onCapture: () => void;
  originalCanvasRef: RefObject<HTMLCanvasElement>;
  processedCanvasRef: RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: RefObject<HTMLCanvasElement>;
  isProcessing: boolean;
  isAnalyzing: boolean;
  faceDetection: any;
  facialDifference: number | null;
  imageDimensions: { width: number; height: number };
  triggerFileInput: () => void;
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
  presetsComponent?: React.ReactNode;
  faceMaskSelector?: React.ReactNode;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
  onMaskPositionChange?: (newPosition: { x: number, y: number }) => void;
  onMaskScaleChange?: (newScale: number) => void;
}

const EditorTabs: React.FC<EditorTabsProps> = ({
  activeTab,
  onTabChange,
  originalImage,
  handleImageUpload,
  fileInputRef,
  videoRef,
  streamRef,
  onCapture,
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
  showLandmarks,
  toggleLandmarks,
  featureSliders,
  sliderValues,
  onSliderChange,
  onSliderChangeComplete,
  onResetSliders,
  onRandomizeSliders,
  handleLandmarkMove,
  autoAnalyze,
  onToggleAutoAnalyze,
  presetsComponent,
  faceMaskSelector,
  maskPosition,
  maskScale,
  onMaskPositionChange,
  onMaskScaleChange
}) => {
  return (
    <Tabs defaultValue="upload" value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
        <TabsTrigger value="upload">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </TabsTrigger>
        <TabsTrigger value="webcam">
          <Camera className="h-4 w-4 mr-2" />
          Webcam
        </TabsTrigger>
        <TabsTrigger value="edit" disabled={!originalImage}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Edit
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <ImageUploader 
          inputRef={fileInputRef} 
          onImageUpload={handleImageUpload} 
          triggerFileInput={triggerFileInput}
        />
      </TabsContent>

      <TabsContent value="webcam">
        <WebcamCapture 
          videoRef={videoRef} 
          streamRef={streamRef} 
          onCapture={onCapture} 
        />
      </TabsContent>

      <TabsContent value="edit">
        <div className="space-y-6">
          {/* Face Mask Selector section */}
          {faceMaskSelector && (
            <div className="mb-4">
              {faceMaskSelector}
            </div>
          )}
          
          <EditorContent
            originalCanvasRef={originalCanvasRef}
            processedCanvasRef={processedCanvasRef}
            cleanProcessedCanvasRef={cleanProcessedCanvasRef}
            originalImage={originalImage}
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
            featureSliders={featureSliders}
            sliderValues={sliderValues}
            onSliderChange={onSliderChange}
            onSliderChangeComplete={onSliderChangeComplete}
            onResetSliders={onResetSliders}
            onRandomizeSliders={onRandomizeSliders}
            handleLandmarkMove={handleLandmarkMove}
            autoAnalyze={autoAnalyze}
            onToggleAutoAnalyze={onToggleAutoAnalyze}
            maskPosition={maskPosition}
            maskScale={maskScale}
            onMaskPositionChange={onMaskPositionChange}
            onMaskScaleChange={onMaskScaleChange}
            faceMaskSelector={faceMaskSelector}
          />
          
          {/* Presets section */}
          {presetsComponent && (
            <div className="mb-4">
              {presetsComponent}
            </div>
          )}
          
          {/* Facial Recognition Resources section - now in its own box below presets */}
          <div className="mb-4">
            <FacialRecognitionResources />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default EditorTabs;
