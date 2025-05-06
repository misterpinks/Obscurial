
import React, { useState, useEffect, useRef, memo } from 'react';
import { Circle, ZoomIn, ZoomOut, Grab, Move } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  title: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isProcessing?: boolean;
  isAnalyzing?: boolean;
  noFaceDetected?: boolean;
  originalImage?: HTMLImageElement | null;
  className?: string;
  enableZoom?: boolean;
  onLandmarkMove?: (pointIndex: number, x: number, y: number) => void;
  faceDetection?: any;
}

// Use memo to prevent unnecessary re-renders
const ImagePreview: React.FC<ImagePreviewProps> = memo(({
  title,
  canvasRef,
  isProcessing = false,
  isAnalyzing = false,
  noFaceDetected = false,
  originalImage,
  className,
  enableZoom = false,
  onLandmarkMove,
  faceDetection
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeLandmark, setActiveLandmark] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reset zoom and pan when image changes
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [originalImage]);

  const handleZoomIn = () => {
    if (scale < 5) {  // Limit max zoom
      setScale(prevScale => prevScale + 0.5);
    }
  };

  const handleZoomOut = () => {
    if (scale > 1) {  // Limit min zoom
      setScale(prevScale => prevScale - 0.5);
    } else {
      // If scale would go below 1, reset to 1 and also reset offset
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !enableZoom) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Check if we're clicking on a landmark point
    if (faceDetection?.landmarks) {
      const landmarks = faceDetection.landmarks.positions;
      for (let i = 0; i < landmarks.length; i++) {
        const point = landmarks[i];
        // Adjust for current scale and offset
        const adjustedX = point.x * scale + offset.x;
        const adjustedY = point.y * scale + offset.y;
        
        // Check if click is within 10px of a landmark
        if (Math.abs(x * scale - adjustedX) < 10 && Math.abs(y * scale - adjustedY) < 10) {
          setActiveLandmark(i);
          return;
        }
      }
    }
    
    // If not clicking on a landmark, start panning
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom) return;
    
    if (isDragging) {
      // Handle panning
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (activeLandmark !== null && onLandmarkMove && canvasRef.current) {
      // Handle landmark dragging
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale - offset.x / scale;
      const y = (e.clientY - rect.top) / scale - offset.y / scale;
      
      onLandmarkMove(activeLandmark, x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveLandmark(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setActiveLandmark(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !enableZoom || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;
    
    // Check for landmark touch
    if (faceDetection?.landmarks) {
      const landmarks = faceDetection.landmarks.positions;
      for (let i = 0; i < landmarks.length; i++) {
        const point = landmarks[i];
        // Use larger touch area for mobile
        const touchRadius = 20; 
        const adjustedX = point.x * scale + offset.x;
        const adjustedY = point.y * scale + offset.y;
        
        if (Math.abs(x * scale - adjustedX) < touchRadius && 
            Math.abs(y * scale - adjustedY) < touchRadius) {
          setActiveLandmark(i);
          e.preventDefault(); // Prevent scrolling
          return;
        }
      }
    }
    
    // Start panning on touch
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!enableZoom || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling while manipulating
    
    const touch = e.touches[0];
    if (isDragging) {
      // Handle touch panning
      const dx = touch.clientX - dragStart.x;
      const dy = touch.clientY - dragStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else if (activeLandmark !== null && onLandmarkMove && canvasRef.current) {
      // Handle landmark dragging on touch
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / scale - offset.x / scale;
      const y = (touch.clientY - rect.top) / scale - offset.y / scale;
      
      onLandmarkMove(activeLandmark, x, y);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setActiveLandmark(null);
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const canvasTransform = enableZoom ? `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` : undefined;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-center font-medium mb-2">{title}</div>
        <div 
          className="relative border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 h-[300px]"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-full object-contain origin-center transition-transform"
            style={{ 
              transform: canvasTransform,
              cursor: enableZoom ? (isDragging ? 'grabbing' : 'grab') : 'default',
              willChange: 'transform' // Performance hint
            }}
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
          
          {/* Zoom controls */}
          {enableZoom && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              <Button 
                variant="secondary" 
                size="icon" 
                className="w-8 h-8 bg-white/90 hover:bg-white"
                onClick={handleZoomIn}
              >
                <ZoomIn size={16} />
              </Button>
              <Button 
                variant="secondary" 
                size="icon" 
                className="w-8 h-8 bg-white/90 hover:bg-white"
                onClick={handleZoomOut}
              >
                <ZoomOut size={16} />
              </Button>
              <Button 
                variant="secondary"
                size="icon"
                className="w-8 h-8 bg-white/90 hover:bg-white"
                onClick={handleReset}
              >
                <Move size={16} />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ImagePreview.displayName = 'ImagePreview';

export default ImagePreview;
