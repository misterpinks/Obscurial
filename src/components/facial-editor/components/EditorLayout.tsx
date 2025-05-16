
import React from 'react';
import EditorHeader from '../EditorHeader';
import ModelSetup from '../../ModelSetup';
import EditorToolbar from '../EditorToolbar';
import EditorTabs from '../EditorTabs';
import PresetSelector from '../PresetSelector';
import FaceMaskSelector from '../FaceMaskSelector';
import FaceMirrorControls from '../FaceMirrorControls';
import type { BatchJob } from '../hooks';

interface EditorLayoutProps {
  modelsLoadingStatus: 'loading' | 'success' | 'error';
  toolbarProps: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    batchJobs: BatchJob[];
    isBatchProcessing: boolean;
    onAddBatchImages: () => void;
    onRemoveBatchJob: (id: string) => void;
    onClearBatchJobs: () => void;
    onProcessBatchJobs: () => void;
    onDownloadAllBatchJobs: () => void;
  };
  tabsProps: {
    activeTab: string;
    onTabChange: (value: string) => void;
    originalImage: HTMLImageElement | null;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    videoRef: React.RefObject<HTMLVideoElement>;
    streamRef: React.MutableRefObject<MediaStream | null>;
    onCapture: () => HTMLImageElement | null;
    originalCanvasRef: React.RefObject<HTMLCanvasElement>;
    processedCanvasRef: React.RefObject<HTMLCanvasElement>;
    cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>;
    isProcessing: boolean;
    isAnalyzing: boolean;
    faceDetection: any;
    facialDifference: number | null;
    imageDimensions?: { width: number, height: number };
    triggerFileInput: () => void;
    downloadImage: () => void;
    hasProcessedImage: boolean;
    handleRunAnalysis: () => void;
    showLandmarks: boolean;
    toggleLandmarks: () => void;
    featureSliders: any[];
    sliderValues: Record<string, number>;
    onSliderChange: (id: string, value: number) => void;
    onSliderChangeComplete: () => void;
    onResetSliders: () => void;
    onRandomizeSliders: () => void;
    handleLandmarkMove: (pointIndex: number, x: number, y: number) => void;
    autoAnalyze: boolean;
    onToggleAutoAnalyze: () => void;
    maskPosition: { x: number, y: number };
    maskScale: number;
    onMaskPositionChange: (position: { x: number, y: number }) => void;
    onMaskScaleChange: (scale: number) => void;
    faceMaskSelector: React.ReactNode;
    onToggleMirror: () => void;
    onToggleMirrorSide: () => void;
    presetsComponent: React.ReactElement;
    mirrorControls: React.ReactElement;
  };
}

const EditorLayout: React.FC<EditorLayoutProps> = ({
  modelsLoadingStatus,
  toolbarProps,
  tabsProps,
}) => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EditorHeader />

      {modelsLoadingStatus === 'error' && <ModelSetup />}

      <EditorToolbar 
        canUndo={toolbarProps.canUndo}
        canRedo={toolbarProps.canRedo}
        onUndo={toolbarProps.onUndo}
        onRedo={toolbarProps.onRedo}
        batchJobs={toolbarProps.batchJobs}
        isBatchProcessing={toolbarProps.isBatchProcessing}
        onAddBatchImages={toolbarProps.onAddBatchImages}
        onRemoveBatchJob={toolbarProps.onRemoveBatchJob}
        onClearBatchJobs={toolbarProps.onClearBatchJobs}
        onProcessBatchJobs={toolbarProps.onProcessBatchJobs}
        onDownloadAllBatchJobs={toolbarProps.onDownloadAllBatchJobs}
      />

      <EditorTabs 
        activeTab={tabsProps.activeTab}
        onTabChange={tabsProps.onTabChange}
        originalImage={tabsProps.originalImage}
        handleImageUpload={tabsProps.handleImageUpload}
        fileInputRef={tabsProps.fileInputRef}
        videoRef={tabsProps.videoRef}
        streamRef={tabsProps.streamRef}
        onCapture={tabsProps.onCapture}
        originalCanvasRef={tabsProps.originalCanvasRef}
        processedCanvasRef={tabsProps.processedCanvasRef}
        cleanProcessedCanvasRef={tabsProps.cleanProcessedCanvasRef}
        isProcessing={tabsProps.isProcessing}
        isAnalyzing={tabsProps.isAnalyzing}
        faceDetection={tabsProps.faceDetection}
        facialDifference={tabsProps.facialDifference}
        imageDimensions={tabsProps.imageDimensions}
        triggerFileInput={tabsProps.triggerFileInput}
        downloadImage={tabsProps.downloadImage}
        hasProcessedImage={tabsProps.hasProcessedImage}
        handleRunAnalysis={tabsProps.handleRunAnalysis}
        showLandmarks={tabsProps.showLandmarks}
        toggleLandmarks={tabsProps.toggleLandmarks}
        featureSliders={tabsProps.featureSliders}
        sliderValues={tabsProps.sliderValues}
        onSliderChange={tabsProps.onSliderChange}
        onSliderChangeComplete={tabsProps.onSliderChangeComplete}
        onResetSliders={tabsProps.onResetSliders}
        onRandomizeSliders={tabsProps.onRandomizeSliders}
        handleLandmarkMove={tabsProps.handleLandmarkMove}
        autoAnalyze={tabsProps.autoAnalyze}
        onToggleAutoAnalyze={tabsProps.onToggleAutoAnalyze}
        maskPosition={tabsProps.maskPosition}
        maskScale={tabsProps.maskScale}
        onMaskPositionChange={tabsProps.onMaskPositionChange}
        onMaskScaleChange={tabsProps.onMaskScaleChange}
        faceMaskSelector={tabsProps.faceMaskSelector}
        onToggleMirror={tabsProps.onToggleMirror}
        onToggleMirrorSide={tabsProps.onToggleMirrorSide}
        presetsComponent={tabsProps.presetsComponent}
        mirrorControls={tabsProps.mirrorControls}
      />
    </div>
  );
};

export default EditorLayout;
