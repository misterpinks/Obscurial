
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
  usePresets,
  useBatchProcessing,
  useFaceEffects,
  useBatchUpload
} from './hooks';
import { useEditorState } from './hooks/useEditorState';
import { useEditorActions } from './hooks/useEditorActions';
import { useImageProcessingCore } from './hooks/imageProcessing/useImageProcessingCore';

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
  
  // Feature sliders - simplified without history
  const { featureSliders, sliderValues, handleSliderChange, resetSliders, randomizeSliders } = useFeatureSliders();
  
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

  const {
    isAnalyzing,
    faceDetection,
    facialDifference,
    facialTelemetryDelta,
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

  // Custom hook for image processing core with Web Worker support
  const {
    isProcessing: isProcessingCore,
    cleanProcessedImageURL: cleanProcessedImageURLCore,
    processImage: processImageCore,
    worker,
    isWorkerReady
  } = useImageProcessingCore({
    originalImage,
    initialProcessingDone,
    autoAnalyze,
    lastProcessedValues,
    setLastProcessedValues,
    processImageImpl: () => {
      if (!cleanProcessedCanvasRef.current || !originalImage) return undefined;
      
      const cleanCanvas = cleanProcessedCanvasRef.current;
      const cleanCtx = cleanCanvas.getContext('2d');
      if (!cleanCtx) return undefined;
      
      // Set canvas dimensions to match image
      cleanCanvas.width = originalImage.width;
      cleanCanvas.height = originalImage.height;
      
      // Apply feature transformations to the clean canvas
      applyFeatureTransformations({
        ctx: cleanCtx,
        originalImage,
        width: cleanCanvas.width,
        height: cleanCanvas.height,
        faceDetection: null, // Just use approximate transformations
        sliderValues,
        faceEffectOptions,
        worker: isWorkerReady ? worker : undefined
      });
      
      return cleanCanvas;
    },
    analyzeModifiedImage,
    isFaceApiLoaded,
    faceDetection
  });

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
    faceEffectOptions,
    worker,
    isWorkerReady
  });

  // Hook for editor actions - make sure to pass the analyzeModifiedImage function
  const {
    handleResetSliders,
    handleRunAnalysis,
    handleToggleAutoAnalyze
  } = useEditorActions(resetEffects, resetSliders, toggleAutoAnalyze, autoAnalyze, analyzeModifiedImage);

  // Hook for presets
  const { 
    presets, 
    applyPreset, 
    saveCurrentAsPreset, 
    deletePreset 
  } = usePresets(featureSliders, sliderValues, handleSliderChange);

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
          faceEffectOptions,
          worker: isWorkerReady ? worker : undefined
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

  // Display a toast when Web Worker is ready
  React.useEffect(() => {
    if (isWorkerReady) {
      toast({
        title: "Performance Boost Activated",
        description: "Using Web Worker for faster image processing."
      });
    }
  }, [isWorkerReady, toast]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EditorHeader />

      {modelsLoadingStatus === 'error' && <ModelSetup />}

      <EditorToolbar 
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
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
        facialTelemetryDelta={facialTelemetryDelta}
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
        onSliderChangeComplete={() => {}}
        onResetSliders={handleResetSliders}
        onRandomizeSliders={randomizeSliders}
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
