
import React from 'react';
import { useToast } from "@/components/ui/use-toast";
import EditorHeader from './EditorHeader';
import ModelSetup from '../ModelSetup';
import EditorTabs from './EditorTabs';
import PresetSelector from './PresetSelector';
import EditorToolbar from './EditorToolbar';
import FaceMaskSelector from './FaceMaskSelector';

// Import custom hooks
import {
  useFaceApiModels,
  useFeatureSliders,
  useFaceAnalysis,
  useImageProcessing,
  useTabs,
  useFileUpload,
  useLandmarks,
  useHistory,
  usePresets,
  useBatchProcessing,
  useFaceEffects,
  useBatchUpload
} from './hooks';
import { useEditorState } from './hooks/useEditorState';
import { useEditorActions } from './hooks/useEditorActions';

// Import the transformation engine
import { applyFeatureTransformations } from './utils/transformationEngine';

const FacialEditor = () => {
  const { toast } = useToast();
  
  // Use the editor state hook to manage canvas refs and original image
  const {
    originalCanvasRef,
    processedCanvasRef,
    cleanProcessedCanvasRef,
    videoRef,
    streamRef,
    originalImage,
    setOriginalImage
  } = useEditorState();

  // Load face models
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
  
  // Face effects hook
  const {
    effectType,
    setEffectType,
    effectIntensity,
    setEffectIntensity,
    selectedMaskId,
    setSelectedMaskId,
    maskImage,
    handleLoadMaskImage,
    resetEffects,
    maskPosition,
    setMaskPosition,
    maskScale,
    setMaskScale,
    faceEffectOptions
  } = useFaceEffects();
  
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
    toggleAutoAnalyze,
    lastProcessedValues,
    setLastProcessedValues
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
    autoAnalyze,
    lastProcessedValues,
    setLastProcessedValues,
    faceEffectOptions
  });

  // Hook for editor actions
  const {
    handleResetSliders,
    handleRunAnalysis,
    handleToggleAutoAnalyze
  } = useEditorActions(resetEffects, resetSliders, toggleAutoAnalyze, autoAnalyze);

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
          sliderValues,
          faceEffectOptions
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

  // Hook for batch upload
  const { handleBatchUpload } = useBatchUpload(addToBatch);

  // FIX: Handle the webcam capture function to return HTMLImageElement as required
  const handleCaptureFromWebcam = () => {
    const img = captureFromWebcam();
    if (img) {
      setOriginalImage(img);
      return img;
    }
    return null;
  };

  // Create the mask selector element
  const faceMaskSelector = (
    <FaceMaskSelector
      effectType={effectType}
      setEffectType={setEffectType}
      effectIntensity={effectIntensity}
      setEffectIntensity={setEffectIntensity}
      selectedMaskId={selectedMaskId}
      setSelectedMaskId={setSelectedMaskId}
      onLoadMaskImage={handleLoadMaskImage}
      maskPosition={maskPosition}
      setMaskPosition={setMaskPosition}
      maskScale={maskScale}
      setMaskScale={setMaskScale}
    />
  );

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EditorHeader />

      {modelsLoadingStatus === 'error' && <ModelSetup />}

      <EditorToolbar 
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        batchJobs={batchJobs}
        isBatchProcessing={isBatchProcessing}
        onAddBatchImages={handleBatchUpload}
        onRemoveBatchJob={removeFromBatch}
        onClearBatchJobs={clearBatch}
        onProcessBatchJobs={processBatch}
        onDownloadAllBatchJobs={downloadAll}
      />

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
        maskPosition={maskPosition}
        maskScale={maskScale}
        onMaskPositionChange={setMaskPosition}
        onMaskScaleChange={setMaskScale}
        faceMaskSelector={faceMaskSelector}
        presetsComponent={
          <PresetSelector 
            presets={presets}
            onApplyPreset={applyPreset}
            onSavePreset={saveCurrentAsPreset}
            onDeletePreset={deletePreset}
          />
        }
      />
    </div>
  );
};

export default FacialEditor;
