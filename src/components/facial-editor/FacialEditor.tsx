
import React, { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import EditorHeader from './EditorHeader';
import ModelSetup from '../ModelSetup';
import EditorTabs from './EditorTabs';

import {
  useFaceApiModels,
  useFeatureSliders,
  useFaceAnalysis,
  useImageProcessing,
  useTabs,
  useFileUpload,
  useLandmarks
} from './hooks';

const FacialEditor = () => {
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cleanProcessedCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Custom hooks for models loading, facial processing, and sliders
  const { isFaceApiLoaded, modelsLoadingStatus } = useFaceApiModels();
  const { featureSliders, sliderValues, handleSliderChange, resetSliders, randomizeSliders } = useFeatureSliders();
  const {
    isAnalyzing,
    faceDetection,
    facialDifference,
    initialProcessingDone,
    detectFaces,
    analyzeModifiedImage,
    setInitialProcessingDone,
    setFaceDetection,
    imageDimensions,
    hasShownNoFaceToast,
    setHasShownNoFaceToast,
    autoAnalyze,
    toggleAutoAnalyze
  } = useFaceAnalysis(isFaceApiLoaded, originalImage, cleanProcessedCanvasRef);

  // Custom hook for landmarks handling
  const { showLandmarks, toggleLandmarks, handleLandmarkMove } = useLandmarks(setFaceDetection);

  // Custom hook for tabs management
  const { activeTab, handleTabChange, captureFromWebcam } = useTabs({
    videoRef,
    streamRef,
    originalImage,
    setFaceDetection,
    setInitialProcessingDone,
    setHasShownNoFaceToast
  });

  // Custom hook for file uploading
  const { fileInputRef, handleImageUpload, triggerFileInput } = useFileUpload({
    setOriginalImage,
    setActiveTab: handleTabChange,
    setFaceDetection,
    setInitialProcessingDone,
    setHasShownNoFaceToast
  });

  // Custom hook for image processing
  const {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    downloadImage
  } = useImageProcessing({
    originalImage,
    originalCanvasRef,
    processedCanvasRef,
    cleanProcessedCanvasRef,
    faceDetection,
    sliderValues,
    initialProcessingDone,
    showLandmarks,
    isFaceApiLoaded,
    detectFaces,
    analyzeModifiedImage,
    autoAnalyze
  });

  const handleCaptureFromWebcam = () => {
    const img = captureFromWebcam();
    if (img) {
      setOriginalImage(img);
    }
  };

  const handleRunAnalysis = () => {
    if (faceDetection && isFaceApiLoaded) {
      analyzeModifiedImage();
      
      toast({
        title: "Analysis Started",
        description: "Analyzing facial changes..."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Analyze",
        description: "No face was detected in the original image."
      });
    }
  };

  const handleResetSliders = () => {
    resetSliders();
    toast({
      title: "Settings Reset",
      description: "All adjustments have been reset to default values."
    });
  };

  const handleToggleAutoAnalyze = () => {
    toggleAutoAnalyze();
    toast({
      title: autoAnalyze ? "Auto-Analysis Disabled" : "Auto-Analysis Enabled",
      description: autoAnalyze 
        ? "You'll need to manually run analysis now."
        : "Analysis will run automatically when making adjustments."
    });
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EditorHeader />

      {modelsLoadingStatus === 'error' && <ModelSetup />}

      <EditorTabs 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        originalImage={originalImage}
        handleImageUpload={handleImageUpload}
        fileInputRef={fileInputRef}
        videoRef={videoRef}
        streamRef={streamRef}
        onCapture={handleCaptureFromWebcam}
        originalCanvasRef={originalCanvasRef}
        processedCanvasRef={processedCanvasRef}
        cleanProcessedCanvasRef={cleanProcessedCanvasRef}
        isProcessing={isProcessing}
        isAnalyzing={isAnalyzing}
        faceDetection={faceDetection}
        facialDifference={facialDifference}
        imageDimensions={imageDimensions}
        triggerFileInput={triggerFileInput}
        downloadImage={downloadImage}
        hasProcessedImage={!!cleanProcessedImageURL}
        handleRunAnalysis={handleRunAnalysis}
        showLandmarks={showLandmarks}
        toggleLandmarks={toggleLandmarks}
        featureSliders={featureSliders}
        sliderValues={sliderValues}
        onSliderChange={handleSliderChange}
        onResetSliders={handleResetSliders}
        onRandomizeSliders={randomizeSliders}
        handleLandmarkMove={handleLandmarkMove}
        autoAnalyze={autoAnalyze}
        onToggleAutoAnalyze={handleToggleAutoAnalyze}
      />
    </div>
  );
};

export default FacialEditor;
