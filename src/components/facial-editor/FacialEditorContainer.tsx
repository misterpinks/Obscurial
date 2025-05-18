import React from 'react';
import { useToast } from "@/components/ui/use-toast";
import PresetSelector from './PresetSelector';
import EditorLayout from './components/EditorLayout';

// Import custom hooks
import {
  useFaceApiModels,
  useFaceAnalysis,
  useImageProcessing,
  useTabs,
  useFileUpload,
  useLandmarks,
  usePresets,
  useEditorState,
  useEditorActions,
  useSlidersWithHistory,
  useMirroringAndEffects,
  useImageProcessingHandler,
  useWebcamCapture,
  useBatchProcessingHandler
} from './hooks';

// Adding explicit export name to match import in FacialEditor.tsx
export const FacialEditorContainer: React.FC<{
  isFaceApiLoaded: boolean;
  modelsLoadingStatus: 'loading' | 'success' | 'error';
}> = ({ isFaceApiLoaded, modelsLoadingStatus }) => {
  const { toast } = useToast();
  
  // Use the editor state hook to manage canvas refs and original image
  const {
    originalCanvasRef,
    processedCanvasRef,
    cleanProcessedCanvasRef,
    videoRef,
    streamRef,
    originalImage,
    setOriginalImage,
    showToast
  } = useEditorState();

  // Load face models
  const { isFaceApiLoaded: faceApiLoaded, modelsLoadingStatus: modelStatus } = useFaceApiModels();
  
  // Sliders with history/undo support
  const {
    featureSliders,
    sliderValues,
    currentSliderValues,
    handleSliderChange,
    handleSliderChangeComplete,
    resetSliders,
    handleRandomize,
    undo,
    redo,
    canUndo,
    canRedo,
    pushSliderState
  } = useSlidersWithHistory();
  
  // Face effects and mirroring
  const {
    resetEffects,
    faceEffectOptions,
    faceMaskSelector,
    mirrorControlsElement,
    handleToggleMirror,
    handleToggleMirrorSide,
    maskPosition,
    maskScale,
    setMaskPosition,
    setMaskScale
  } = useMirroringAndEffects(
    sliderValues || {},
    handleSliderChange,
    handleSliderChangeComplete,
    currentSliderValues || {}
  );

  // Face analysis
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
    setLastProcessedValues,
    onProcessingComplete,
    detectionAttempts
  } = useFaceAnalysis({
    isFaceApiLoaded,
    originalImage,
    cleanProcessedCanvasRef,
    toast
  });

  // Image processing with Web Worker support
  const {
    isProcessingCore,
    cleanProcessedImageURLCore,
    processImageCore,
    debouncedProcess,
    processingQueued,
    setProcessingQueued,
    worker,
    isWorkerReady,
    processSingleImage
  } = useImageProcessingHandler({
    originalImage,
    cleanProcessedCanvasRef,
    initialProcessingDone,
    autoAnalyze,
    lastProcessedValues,
    setLastProcessedValues,
    analyzeModifiedImage,
    isFaceApiLoaded,
    faceDetection,
    faceEffectOptions,
    onProcessingComplete
  });

  // Custom hook for landmarks handling
  const { showLandmarks, toggleLandmarks, handleLandmarkMove } = useLandmarks(faceDetection, setFaceDetection);

  // Adapt the landmark move handler to the expected signature
  const adaptedHandleLandmarkMove = (pointIndex: number, x: number, y: number) => {
    handleLandmarkMove({ index: pointIndex }, { x, y });
  };

  // Webcam capture functionality
  const { captureFromWebcam } = useWebcamCapture({
    videoRef,
    streamRef,
    setOriginalImage,
    setActiveTab: (tab) => handleTabChange(tab)
  });

  // Custom hook for tabs management
  const { activeTab, handleTabChange } = useTabs({
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
    sliderValues: sliderValues || {},
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
    isWorkerReady,
    onProcessingComplete
  });

  // Hook for editor actions
  const {
    handleResetSliders,
    handleRunAnalysis,
    handleToggleAutoAnalyze
  } = useEditorActions({
    resetEffects, 
    resetSliders, 
    toggleAutoAnalyze, 
    autoAnalyze, 
    analyzeModifiedImage
  });

  // Hook for presets
  const { 
    presets, 
    applyPreset, 
    saveCurrentAsPreset, 
    deletePreset 
  } = usePresets({
    featureSliders,
    sliderValues: sliderValues || {},
    onChange: (newValues) => {
      // Apply each slider value individually
      Object.entries(newValues).forEach(([id, value]) => {
        handleSliderChange(id, value);
      });
      pushSliderState(newValues);
    }
  });

  // Batch processing setup
  const {
    batchJobs,
    isBatchProcessing,
    handleBatchUpload,
    removeFromBatch,
    clearBatch,
    processBatch,
    downloadAll
  } = useBatchProcessingHandler({
    processSingleImage
  });

  // Fix for the webcam capture function to properly handle the image
  const handleCaptureFromWebcam = () => {
    const img = captureFromWebcam();
    // Just return the captured image, it can be null if capture failed
    return img;
  };

  // Display a toast when Web Worker is ready
  React.useEffect(() => {
    if (isWorkerReady) {
      toast({
        title: "Performance Boost Activated",
        description: "Using Web Worker for faster image processing."
      });
    }
  }, [isWorkerReady, toast]);

  // Add effect to ensure face detection runs after image load
  React.useEffect(() => {
    if (originalImage && isFaceApiLoaded && !initialProcessingDone) {
      console.log("Image loaded and API ready, detecting faces");
      // Use a small timeout to ensure the image is fully loaded
      setTimeout(detectFaces, 100);
    }
  }, [originalImage, isFaceApiLoaded, initialProcessingDone, detectFaces]);

  // Create the preset selector component
  const presetsComponent = (
    <PresetSelector 
      presets={presets}
      onApplyPreset={applyPreset}
      onSavePreset={saveCurrentAsPreset}
      onDeletePreset={deletePreset}
    />
  );

  return (
    <EditorLayout
      modelsLoadingStatus={modelsLoadingStatus}
      toolbarProps={{
        canUndo,
        canRedo,
        onUndo: undo,
        onRedo: redo,
        batchJobs,
        isBatchProcessing,
        onAddBatchImages: handleBatchUpload,
        onRemoveBatchJob: removeFromBatch,
        onClearBatchJobs: clearBatch,
        onProcessBatchJobs: processBatch,
        onDownloadAllBatchJobs: downloadAll
      }}
      tabsProps={{
        activeTab,
        onTabChange: handleTabChange,
        originalImage,
        handleImageUpload,
        fileInputRef,
        videoRef,
        streamRef,
        onCapture: handleCaptureFromWebcam,
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
        hasProcessedImage: !!cleanProcessedImageURL,
        handleRunAnalysis,
        showLandmarks,
        toggleLandmarks,
        featureSliders,
        sliderValues: sliderValues || {},
        onSliderChange: handleSliderChange,
        onSliderChangeComplete: handleSliderChangeComplete,
        onResetSliders: handleResetSliders,
        onRandomizeSliders: handleRandomize,
        handleLandmarkMove: adaptedHandleLandmarkMove,
        autoAnalyze,
        onToggleAutoAnalyze: handleToggleAutoAnalyze,
        maskPosition,
        maskScale,
        onMaskPositionChange: setMaskPosition,
        onMaskScaleChange: setMaskScale,
        faceMaskSelector,
        onToggleMirror: handleToggleMirror,
        onToggleMirrorSide: handleToggleMirrorSide,
        presetsComponent,
        mirrorControls: mirrorControlsElement
      }}
    />
  );
};

// Add default export to make the component available both as named and default export
export default FacialEditorContainer;
