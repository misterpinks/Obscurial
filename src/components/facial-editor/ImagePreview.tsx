
import React, { useRef, useState, useEffect } from 'react';
import { Loader2, AlertCircle } from "lucide-react";

interface ImagePreviewProps {
  title: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isProcessing?: boolean;
  isAnalyzing?: boolean;
  noFaceDetected?: boolean;
  originalImage?: HTMLImageElement | null;
  enableZoom?: boolean;
  onLandmarkMove?: (pointIndex: number, x: number, y: number) => void;
  faceDetection?: any;
  enableMaskControl?: boolean;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
  onMaskPositionChange?: (newPosition: { x: number, y: number }) => void;
  onMaskScaleChange?: (newScale: number) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  title,
  canvasRef,
  isProcessing = false,
  isAnalyzing = false,
  noFaceDetected = false,
  originalImage,
  enableZoom = false,
  onLandmarkMove,
  faceDetection,
  enableMaskControl = false,
  maskPosition,
  maskScale,
  onMaskPositionChange,
  onMaskScaleChange
}) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPoint, setDragPoint] = useState<{ index: number; x: number; y: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [dragMask, setDragMask] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Effect to update canvas display when scale changes
  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      
      // Adjust display size while maintaining internal dimensions
      if (scale !== 1) {
        canvas.style.width = `${canvas.width * scale}px`;
        canvas.style.height = `${canvas.height * scale}px`;
      } else {
        canvas.style.width = '';
        canvas.style.height = '';
      }
    }
  }, [canvasRef, scale]);
  
  // Handle zooming with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (enableZoom) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setScale(prevScale => Math.min(Math.max(prevScale + delta, 0.5), 3));
    }
  };
  
  // Handle mouse down for dragging landmarks
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onLandmarkMove || !faceDetection || !faceDetection.landmarks) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas, accounting for scale
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Check if we're near any landmark point
    const landmarks = faceDetection.landmarks.positions;
    const pointSize = 10; // Detection radius (larger than drawn point)
    
    if (enableMaskControl && maskPosition && onMaskPositionChange) {
      // Convert relative mask position to absolute canvas coordinates
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const absMaskX = centerX + maskPosition.x * canvas.width;
      const absMaskY = centerY + maskPosition.y * canvas.height;
      
      // Check if clicking on mask control point
      if (Math.abs(x - absMaskX) < pointSize && Math.abs(y - absMaskY) < pointSize) {
        setDragMask(true);
        return;
      }
    }
    
    // Check landmarks only if not dragging mask
    for (let i = 0; i < landmarks.length; i++) {
      const point = landmarks[i];
      if (Math.abs(x - point._x) < pointSize && Math.abs(y - point._y) < pointSize) {
        setIsDragging(true);
        setDragPoint({ index: i, x: point._x, y: point._y });
        break;
      }
    }
  };
  
  // Handle mouse move for dragging landmarks
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas, accounting for scale
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Handle mask dragging
    if (dragMask && onMaskPositionChange && maskPosition) {
      // Convert absolute position to relative position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const relX = (x - centerX) / canvas.width;
      const relY = (y - centerY) / canvas.height;
      
      onMaskPositionChange({ x: relX, y: relY });
      return;
    }
    
    // Handle landmark dragging
    if (isDragging && dragPoint && onLandmarkMove) {
      onLandmarkMove(dragPoint.index, x, y);
      return;
    }
    
    // Handle hover effects on landmarks
    if (faceDetection && faceDetection.landmarks) {
      const landmarks = faceDetection.landmarks.positions;
      const pointSize = 10;
      
      let foundHover = false;
      for (let i = 0; i < landmarks.length; i++) {
        const point = landmarks[i];
        if (Math.abs(x - point._x) < pointSize && Math.abs(y - point._y) < pointSize) {
          setHoveredPoint(i);
          foundHover = true;
          break;
        }
      }
      
      if (!foundHover && hoveredPoint !== null) {
        setHoveredPoint(null);
      }
    }
  };
  
  // Handle mouse up for dragging landmarks
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMask(false);
    setDragPoint(null);
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };
  
  // Handle mask scale with keyboard shortcuts
  useEffect(() => {
    if (!enableMaskControl || !onMaskScaleChange) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        if (maskScale) onMaskScaleChange(maskScale * 1.1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        if (maskScale) onMaskScaleChange(maskScale * 0.9);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableMaskControl, onMaskScaleChange, maskScale]);
  
  // Display the canvas content or a status message
  const renderPreviewContent = () => {
    if (isProcessing || isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center p-5 h-full">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
          <p className="text-sm">{isProcessing ? 'Processing...' : 'Analyzing...'}</p>
        </div>
      );
    } else if (noFaceDetected && originalImage) {
      return (
        <div className="flex flex-col items-center justify-center p-2 h-full relative">
          <canvas 
            ref={canvasRef} 
            className="max-w-full object-contain opacity-40"
          />
          <div className="absolute flex flex-col items-center">
            <AlertCircle className="h-10 w-10 text-orange-500 mb-2" />
            <p className="text-sm text-center">No face detected.<br/>Applying global adjustments.</p>
          </div>
        </div>
      );
    } else {
      return (
        <canvas 
          ref={canvasRef} 
          className="max-w-full h-auto object-contain"
          onWheel={enableZoom ? handleWheel : undefined}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      );
    }
  };
  
  // Tips for zoom and mask control
  const renderControlTips = () => {
    if (enableZoom || enableMaskControl) {
      return (
        <div className="text-xs text-gray-500 mt-1">
          {enableZoom && <p>Scroll to zoom</p>}
          {enableMaskControl && <p>Drag mask | +/- keys to resize</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-1">
      {title && <h3 className="text-sm font-medium">{title}</h3>}
      <div 
        className="border rounded-md bg-muted/30 flex items-center justify-center min-h-[150px] overflow-hidden relative"
        ref={containerRef}
      >
        {renderPreviewContent()}
      </div>
      {renderControlTips()}
      
      {/* Debug information */}
      {process.env.NODE_ENV === 'development' && canvasRef.current && (
        <div className="text-xs text-gray-400">
          Canvas: {canvasRef.current.width}x{canvasRef.current.height}
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
