
import React, { useRef, useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertCircle } from "lucide-react";
import { drawFaceLandmarks } from './utils/landmarkVisualization';

interface ImagePreviewProps {
  title: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  originalImage?: HTMLImageElement | null;
  isProcessing?: boolean;
  isAnalyzing?: boolean;
  noFaceDetected?: boolean;
  enableZoom?: boolean;
  enableMaskControl?: boolean;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
  onMaskPositionChange?: (position: { x: number, y: number }) => void;
  onMaskScaleChange?: (scale: number) => void;
  onLandmarkMove?: (pointIndex: number, x: number, y: number) => void;
  faceDetection?: any;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  title,
  canvasRef,
  originalImage,
  isProcessing,
  isAnalyzing,
  noFaceDetected,
  enableZoom = false,
  enableMaskControl = false,
  maskPosition,
  maskScale,
  onMaskPositionChange,
  onMaskScaleChange,
  onLandmarkMove,
  faceDetection
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragPoint, setDragPoint] = useState<number | null>(null);
  const [isDraggingMask, setIsDraggingMask] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isShowingCanvas, setIsShowingCanvas] = useState(false);
  const [canvasCheckTimer, setCanvasCheckTimer] = useState<number | null>(null);
  const wheelEvtOpts = useRef<AddEventListenerOptions>({ passive: false });

  // Add wheel event listener with non-passive option
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enableZoom) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setScale(prevScale => Math.min(Math.max(prevScale + delta, 0.5), 3));
    };

    canvas.addEventListener('wheel', handleWheel, wheelEvtOpts.current);
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel, wheelEvtOpts.current);
    };
  }, [canvasRef, enableZoom]);

  // Check if the canvas has content - with improved checking
  useEffect(() => {
    // Clear any existing timer
    if (canvasCheckTimer !== null) {
      clearTimeout(canvasCheckTimer);
    }
    
    // Set up a new check timer
    const timerId = window.setTimeout(() => {
      checkCanvasContent();
    }, 300); // Longer delay to ensure canvas has been rendered
    
    setCanvasCheckTimer(timerId);
    
    return () => {
      if (canvasCheckTimer !== null) {
        clearTimeout(canvasCheckTimer);
      }
    };
  }, [canvasRef.current, originalImage, isProcessing, isAnalyzing]);
  
  const checkCanvasContent = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("Canvas ref not available");
      setIsShowingCanvas(false);
      return;
    }
    
    try {
      // First check canvas dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        console.log("Canvas has zero dimensions");
        setIsShowingCanvas(false);
        return;
      }
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.error('Could not get canvas context');
        setIsShowingCanvas(false);
        return;
      }
      
      // Optimization: only check a sample of pixels
      const sampleSize = Math.min(canvas.width, canvas.height) / 4;
      if (sampleSize <= 0) {
        setIsShowingCanvas(false);
        return;
      }
      
      try {
        // Check if the canvas has any non-transparent pixels in the center
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        
        // Get a small region around the center
        const imageData = ctx.getImageData(
          centerX - sampleSize / 2, 
          centerY - sampleSize / 2, 
          sampleSize, 
          sampleSize
        );
        
        const data = imageData.data;
        let hasContent = false;
        
        // Sample pixels (check every 10th pixel for speed)
        for (let i = 0; i < data.length; i += 40) {
          // If any pixel has alpha > 0, canvas has content
          if (data[i + 3] > 0) {
            hasContent = true;
            break;
          }
        }
        
        setIsShowingCanvas(hasContent);
        
        if (!hasContent && originalImage) {
          console.log("Canvas appears empty but originalImage exists - forcing display");
          setIsShowingCanvas(true);
        }
      } catch (e) {
        console.warn("Error checking canvas content:", e);
        // If we can't access the canvas data, assume it has content if original image exists
        setIsShowingCanvas(!!originalImage);
      }
    } catch (e) {
      console.error("Error in checkCanvasContent:", e);
      setIsShowingCanvas(!!originalImage);
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
        setIsDraggingMask(true);
        return;
      }
    }
    
    // Check landmarks only if not dragging mask
    for (let i = 0; i < landmarks.length; i++) {
      const point = landmarks[i];
      if (Math.abs(x - point._x) < pointSize && Math.abs(y - point._y) < pointSize) {
        setDragging(true);
        setDragPoint(i);
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
    if (isDraggingMask && onMaskPositionChange && maskPosition) {
      // Convert absolute position to relative position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const relX = (x - centerX) / canvas.width;
      const relY = (y - centerY) / canvas.height;
      
      onMaskPositionChange({ x: relX, y: relY });
      return;
    }
    
    // Handle landmark dragging
    if (dragging && dragPoint !== null && onLandmarkMove) {
      onLandmarkMove(dragPoint, x, y);
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
    setDragging(false);
    setIsDraggingMask(false);
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
    <div className="relative rounded-lg border overflow-hidden h-48 md:h-64 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {title && <h3 className="text-sm font-medium absolute top-2 left-2 z-10 bg-white/80 dark:bg-black/80 px-2 py-1 rounded">{title}</h3>}
      
      <div 
        ref={containerRef}
        className={`relative flex-grow flex items-center justify-center overflow-hidden ${enableZoom ? 'cursor-move' : ''}`}
      >
        {/* Loading indicators */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm font-medium">Processing...</span>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm font-medium">Analyzing...</span>
          </div>
        )}
        
        {/* No face detected message */}
        {noFaceDetected && !isShowingCanvas && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-5 text-center p-4">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">No face detected.</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Applying global adjustments</p>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {!originalImage && !isShowingCanvas && !isProcessing && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full w-full text-center p-4">
            <Skeleton className="h-16 w-16 rounded mb-2" />
            <p className="text-sm text-gray-400">No image loaded</p>
          </div>
        )}
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className={`max-h-full max-w-full object-contain transition-opacity ${isShowingCanvas ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: `scale(${scale})`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      
      {renderControlTips()}
    </div>
  );
};

export default ImagePreview;
