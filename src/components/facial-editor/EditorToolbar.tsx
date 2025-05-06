
import React from 'react';
import UndoRedoControls from './UndoRedoControls';
import SplitViewControls from './SplitViewControls';
import BatchProcessor from './BatchProcessor';
import { SplitViewMode } from './hooks/useSplitView';
import { BatchJob } from './hooks/useBatchProcessing';

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  splitViewMode: SplitViewMode;
  onSplitViewChange: (mode?: SplitViewMode) => void;
  batchJobs: BatchJob[];
  isBatchProcessing: boolean;
  onAddBatchImages: () => void;
  onRemoveBatchJob: (jobId: string) => void;
  onClearBatchJobs: () => void;
  onProcessBatchJobs: () => void;
  onDownloadAllBatchJobs: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  splitViewMode,
  onSplitViewChange,
  batchJobs,
  isBatchProcessing,
  onAddBatchImages,
  onRemoveBatchJob,
  onClearBatchJobs,
  onProcessBatchJobs,
  onDownloadAllBatchJobs
}) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <UndoRedoControls 
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      
      <div className="h-6 border-l border-gray-200 mx-2"></div>
      
      <SplitViewControls 
        mode={splitViewMode}
        onChange={onSplitViewChange}
      />
      
      <div className="h-6 border-l border-gray-200 mx-2"></div>
      
      <BatchProcessor 
        jobs={batchJobs}
        isProcessing={isBatchProcessing}
        onAddImages={onAddBatchImages}
        onRemoveJob={onRemoveBatchJob}
        onClearJobs={onClearBatchJobs}
        onProcessJobs={onProcessBatchJobs}
        onDownloadAll={onDownloadAllBatchJobs}
      />
    </div>
  );
};

export default EditorToolbar;
