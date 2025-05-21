
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  noFaceDetected?: boolean;
  isShowingCanvas: boolean;
  isProcessing?: boolean;
  isAnalyzing?: boolean;
  originalImage?: HTMLImageElement | null;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  noFaceDetected, 
  isShowingCanvas, 
  isProcessing, 
  isAnalyzing, 
  originalImage 
}) => {
  // No face detected message
  if (noFaceDetected && !isShowingCanvas) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-5 text-center p-4">
        <div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">No face detected.</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Applying global adjustments</p>
        </div>
      </div>
    );
  }
  
  // Empty state when no image is loaded
  if (!originalImage && !isShowingCanvas && !isProcessing && !isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center p-4">
        <Skeleton className="h-16 w-16 rounded mb-2" />
        <p className="text-sm text-gray-400">No image loaded</p>
      </div>
    );
  }
  
  return null;
};

export default EmptyState;
