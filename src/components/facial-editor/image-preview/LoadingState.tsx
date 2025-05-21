
import React from 'react';
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  isProcessing?: boolean;
  isAnalyzing?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isProcessing, isAnalyzing }) => {
  if (!isProcessing && !isAnalyzing) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="ml-2 text-sm font-medium">
        {isProcessing ? 'Processing...' : 'Analyzing...'}
      </span>
    </div>
  );
};

export default LoadingState;
