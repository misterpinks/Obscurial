
import React, { RefObject } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, ImageIcon } from "lucide-react";
import WebcamCapture from './WebcamCapture';
import ImageUploader from './ImageUploader';
import EditorContent from './EditorContent';

interface EditorTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  originalImage: HTMLImageElement | null;
  fileInputRef: RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  videoRef: RefObject<HTMLVideoElement>;
  streamRef: RefObject<MediaStream | null>;
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
  onResetSliders: () => void;
  onRandomizeSliders: () => void;
  handleLandmarkMove: (pointIndex: number, x: number, y: number) => void;
  autoAnalyze?: boolean;
  onToggleAutoAnalyze?: () => void;
}

const EditorTabs: React.FC<EditorTabsProps> = ({
  activeTab,
  onTabChange,
  originalImage,
  fileInputRef,
  handleImageUpload,
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
  onResetSliders,
  onRandomizeSliders,
  handleLandmarkMove,
  autoAnalyze,
  onToggleAutoAnalyze
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
          fileInputRef={fileInputRef}
          handleImageUpload={handleImageUpload}
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
          onResetSliders={onResetSliders}
          onRandomizeSliders={onRandomizeSliders}
          handleLandmarkMove={handleLandmarkMove}
          autoAnalyze={autoAnalyze}
          onToggleAutoAnalyze={onToggleAutoAnalyze}
        />
      </TabsContent>
    </Tabs>
  );
};

export default EditorTabs;
