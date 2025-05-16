
import { useCallback } from 'react';
import { useBatchProcessing, type BatchJob } from './useBatchProcessing';
import { useBatchUpload } from './useBatchUpload';

interface UseBatchProcessingHandlerProps {
  processSingleImage: (img: HTMLImageElement) => Promise<string>;
}

export function useBatchProcessingHandler({
  processSingleImage
}: UseBatchProcessingHandlerProps) {
  // Set up batch processing
  const {
    batchJobs,
    isBatchProcessing,
    addToBatch,
    removeFromBatch,
    clearBatch,
    processBatch,
    downloadAll
  } = useBatchProcessing(
    {}, // Empty sliderValues object as first argument
    processSingleImage // The process function as second argument
  );

  // Set up batch upload
  const { handleBatchUpload } = useBatchUpload(addToBatch);

  return {
    batchJobs,
    isBatchProcessing,
    addToBatch,
    removeFromBatch,
    clearBatch,
    processBatch,
    downloadAll,
    handleBatchUpload
  };
}
