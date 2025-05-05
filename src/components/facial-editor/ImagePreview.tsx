
import React from 'react';
import { Circle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface ImagePreviewProps {
  title: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isProcessing?: boolean;
  isAnalyzing?: boolean;
  noFaceDetected?: boolean;
  originalImage?: HTMLImageElement | null;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  title,
  canvasRef,
  isProcessing = false,
  isAnalyzing = false,
  noFaceDetected = false,
  originalImage,
  className
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-center font-medium mb-2">{title}</div>
        <div className="relative border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 h-[300px]">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-full object-contain"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-white">Processing...</div>
            </div>
          )}
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center">
                <Circle className="h-6 w-6 animate-spin mb-2" />
                <span>Analyzing face...</span>
              </div>
            </div>
          )}
          {noFaceDetected && !isAnalyzing && originalImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-white bg-black/70 font-medium px-3 py-1 rounded">
                No face detected
              </div>
            </div>
          )}
          {!originalImage && title === "Original" && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              No image loaded
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImagePreview;
