
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import EditorHeader from './EditorHeader';
import ModelSetup from '../ModelSetup';
import EditorTabs from './EditorTabs';
import PresetSelector from './PresetSelector';
import UndoRedoControls from './UndoRedoControls';
import SplitViewControls from './SplitViewControls';
import SplitViewComparison from './SplitViewComparison';
import BatchProcessor from './BatchProcessor';

import {
  useFaceApiModels,
  useFeatureSliders,
  useFaceAnalysis,
  useImageProcessing,
  useTabs,
  useFileUpload,
  useLandmarks
} from './hooks';

import {
  usePresets,
  useHistory,
  useSplitView,
  useBatchProcessing
} from './hooks';

import { SplitViewMode } from './hooks/useSplitView';

const FacialEditor = () => {
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cleanProcessedCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Custom hooks for models loading, facial processing
  const { isFaceApiLoaded, modelsLoadingStatus } = useFaceApiModels();
  
  // Feature sliders with history/undo support
  const { featureSliders, sliderValues: currentSliderValues, handleSliderChange: baseHandleSliderChange, resetSliders: baseResetSliders, randomizeSliders } = useFeatureSliders();
  
  // Add history tracking for slider values
  const { 
    state: sliderValues, 
    pushState: pushSliderState, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory<Record<string, number>>(currentSliderValues);
  
  // Handle slider changes with history
  const handleSliderChange = (id: string, value: number) => {
    baseHandleSliderChange(id, value);
    // We don't push to history on every change - too many states
  };
  
  // After slider changes finish (e.g., on slider release), push to history
  const handleSliderChangeComplete = () => {
    pushSliderState(currentSliderValues);
  };
  
  // Reset sliders with history
  const resetSliders = () => {
    baseResetSliders();
    pushSliderState(currentSliderValues);
  };
  
  // Apply a randomized preset with history
  const handleRandomize = () => {
    randomizeSliders();
    pushSliderState(currentSliderValues);
  };
  
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

  // Hook for presets
  const { 
    presets, 
    applyPreset, 
    saveCurrentAsPreset, 
    deletePreset 
  } = usePresets(featureSliders, sliderValues, (newValues) => {
    baseHandleSliderChange('batch', newValues);
    pushSliderState(newValues);
  });

  // Hook for split view
  const {
    splitViewMode,
    splitPosition,
    toggleSplitViewMode,
    updateSplitPosition,
  } = useSplitView();

  // Process single image for batch processing
  const processSingleImage = async (img: HTMLImageElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw the image first
        ctx.drawImage(img, 0, 0);
        
        // Apply transformations (simplified for batch processing)
        applyFeatureTransformations({
          ctx,
          originalImage: img,
          width: canvas.width,
          height: canvas.height,
          faceDetection: null, // Just use approximate transformations
          sliderValues
        });
        
        // Return the data URL
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    });
  };

  // Hook for batch processing
  const {
    batchJobs,
    isBatchProcessing,
    addToBatch,
    removeFromBatch,
    clearBatch,
    processBatch,
    downloadAll
  } = useBatchProcessing(sliderValues, processSingleImage);

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

  // Handle multiple file uploads for batch processing
  const handleBatchUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const img = new Image();
          
          img.onload = () => {
            addToBatch(img, file.name);
          };
          
          img.src = event.target?.result as string;
        };
        
        reader.readAsDataURL(file);
      });
    };
    
    input.click();
  };

  // Apply a preset
  const handleApplyPreset = (presetId: string) => {
    applyPreset(presetId);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EditorHeader />

      {modelsLoadingStatus === 'error' && <ModelSetup />}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <UndoRedoControls 
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />
        
        <div className="h-6 border-l border-gray-200 mx-2"></div>
        
        <SplitViewControls 
          mode={splitViewMode}
          onChange={toggleSplitViewMode}
        />
        
        <div className="h-6 border-l border-gray-200 mx-2"></div>
        
        <BatchProcessor 
          jobs={batchJobs}
          isProcessing={isBatchProcessing}
          onAddImages={handleBatchUpload}
          onRemoveJob={removeFromBatch}
          onClearJobs={clearBatch}
          onProcessJobs={processBatch}
          onDownloadAll={downloadAll}
        />
      </div>

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
        onSliderChangeComplete={handleSliderChangeComplete}
        onResetSliders={handleResetSliders}
        onRandomizeSliders={handleRandomize}
        handleLandmarkMove={handleLandmarkMove}
        autoAnalyze={autoAnalyze}
        onToggleAutoAnalyze={handleToggleAutoAnalyze}
        splitViewMode={splitViewMode}
        splitPosition={splitPosition}
        onSplitPositionChange={updateSplitPosition}
        splitViewComponent={
          splitViewMode !== SplitViewMode.NONE && originalCanvasRef.current && processedCanvasRef.current ? (
            <SplitViewComparison 
              originalCanvas={originalCanvasRef}
              processedCanvas={processedCanvasRef}
              mode={splitViewMode}
              splitPosition={splitPosition}
              onSplitPositionChange={updateSplitPosition}
            />
          ) : null
        }
        presetsComponent={
          <PresetSelector 
            presets={presets}
            onApplyPreset={handleApplyPreset}
            onSavePreset={saveCurrentAsPreset}
            onDeletePreset={deletePreset}
          />
        }
      />
    </div>
  );
};

export default FacialEditor;
