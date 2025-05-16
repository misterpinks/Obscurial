
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
  } = useBatchProcessing(processSingleImage);

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
