
import React, { useState, useEffect, useRef, memo } from 'react';
import { Circle, ZoomIn, ZoomOut, Grab, Move, Square } from 'lucide-react';
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
  enableMaskControl?: boolean;
  onLandmarkMove?: (pointIndex: number, x: number, y: number) => void;
  onMaskPositionChange?: (newPosition: { x: number, y: number }) => void;
  onMaskScaleChange?: (newScale: number) => void;
  maskPosition?: { x: number, y: number };
  maskScale?: number;
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
  enableMaskControl = false,
  onLandmarkMove,
  onMaskPositionChange,
  onMaskScaleChange,
  maskPosition,
  maskScale,
  faceDetection
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeLandmark, setActiveLandmark] = useState<number | null>(null);
  const [isDraggingMask, setIsDraggingMask] = useState(false);
  const [isResizingMask, setIsResizingMask] = useState(false);
  const [initialMaskPos, setInitialMaskPos] = useState({ x: 0, y: 0 });
  const [initialMaskScale, setInitialMaskScale] = useState(1);
  const [interactionMode, setInteractionMode] = useState<'zoom' | 'mask'>('zoom');
  
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
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Check if we're in mask control mode and mask dragging is enabled
    if (enableMaskControl && interactionMode === 'mask') {
      if (faceDetection && maskPosition) {
        const box = faceDetection.detection.box;
        const maskCenterX = box.x + box.width/2 + maskPosition.x * box.width;
        const maskCenterY = box.y + box.height/2 + maskPosition.y * box.height;
        const maskWidth = box.width * (maskScale || 1);
        const maskHeight = box.height * (maskScale || 1);
        
        // Check if click is inside mask area
        const halfWidth = maskWidth / 2;
        const halfHeight = maskHeight / 2;
        
        // Check if we're on the edge (resize handles)
        const edgeThreshold = 15;
        const isOnRightEdge = Math.abs(x - (maskCenterX + halfWidth)) < edgeThreshold;
        const isOnBottomEdge = Math.abs(y - (maskCenterY + halfHeight)) < edgeThreshold;
        
        if (isOnRightEdge || isOnBottomEdge) {
          // Start resize operation
          setIsResizingMask(true);
          setInitialMaskScale(maskScale || 1);
          setDragStart({ x: e.clientX, y: e.clientY });
          return;
        }
        
        // Check if we're inside the mask (for moving)
        if (
          x >= maskCenterX - halfWidth && 
          x <= maskCenterX + halfWidth && 
          y >= maskCenterY - halfHeight && 
          y <= maskCenterY + halfHeight
        ) {
          setIsDraggingMask(true);
          setInitialMaskPos({ ...maskPosition });
          setDragStart({ x: e.clientX, y: e.clientY });
          return;
        }
      }
    }
    
    // Handle landmark control if in zoom mode
    if (enableZoom && interactionMode === 'zoom') {
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
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    // Handle mask dragging
    if (isDraggingMask && enableMaskControl && onMaskPositionChange && maskPosition) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = (e.clientX - dragStart.x) / rect.width;
      const dy = (e.clientY - dragStart.y) / rect.height;
      
      // Update mask position with limited range
      const newX = Math.max(-0.5, Math.min(0.5, initialMaskPos.x + dx));
      const newY = Math.max(-0.5, Math.min(0.5, initialMaskPos.y + dy));
      
      onMaskPositionChange({ x: newX, y: newY });
      return;
    }
    
    // Handle mask resizing
    if (isResizingMask && enableMaskControl && onMaskScaleChange) {
      const deltaX = e.clientX - dragStart.x;
      // Calculate scale change based on drag distance
      const scaleChange = deltaX * 0.01;
      const newScale = Math.max(0.5, Math.min(2, initialMaskScale + scaleChange));
      
      onMaskScaleChange(newScale);
      return;
    }
    
    // Handle panning in zoom mode
    if (isDragging && enableZoom && interactionMode === 'zoom') {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Handle landmark dragging
    if (activeLandmark !== null && onLandmarkMove) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale - offset.x / scale;
      const y = (e.clientY - rect.top) / scale - offset.y / scale;
      
      onLandmarkMove(activeLandmark, x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingMask(false);
    setIsResizingMask(false);
    setActiveLandmark(null);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsDraggingMask(false);
    setIsResizingMask(false);
    setActiveLandmark(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!canvasRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;
    
    // Handle mask touch controls
    if (enableMaskControl && interactionMode === 'mask') {
      if (faceDetection && maskPosition) {
        const box = faceDetection.detection.box;
        const maskCenterX = box.x + box.width/2 + maskPosition.x * box.width;
        const maskCenterY = box.y + box.height/2 + maskPosition.y * box.height;
        const maskWidth = box.width * (maskScale || 1);
        const maskHeight = box.height * (maskScale || 1);
        
        // Check if touch is inside mask area
        const halfWidth = maskWidth / 2;
        const halfHeight = maskHeight / 2;
        
        // Check if we're on the edge (resize handles)
        const edgeThreshold = 25; // Larger for touch
        const isOnRightEdge = Math.abs(x - (maskCenterX + halfWidth)) < edgeThreshold;
        const isOnBottomEdge = Math.abs(y - (maskCenterY + halfHeight)) < edgeThreshold;
        
        if (isOnRightEdge || isOnBottomEdge) {
          // Start resize operation
          setIsResizingMask(true);
          setInitialMaskScale(maskScale || 1);
          setDragStart({ x: touch.clientX, y: touch.clientY });
          e.preventDefault();
          return;
        }
        
        // Check if we're inside the mask (for moving)
        if (
          x >= maskCenterX - halfWidth && 
          x <= maskCenterX + halfWidth && 
          y >= maskCenterY - halfHeight && 
          y <= maskCenterY + halfHeight
        ) {
          setIsDraggingMask(true);
          setInitialMaskPos({ ...maskPosition });
          setDragStart({ x: touch.clientX, y: touch.clientY });
          e.preventDefault();
          return;
        }
      }
    }
    
    // Check for landmark touch
    if (enableZoom && interactionMode === 'zoom' && faceDetection?.landmarks) {
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
    
    // Start panning on touch if in zoom mode
    if (enableZoom && interactionMode === 'zoom') {
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!canvasRef.current || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling while manipulating
    
    const touch = e.touches[0];
    
    // Handle mask dragging on touch
    if (isDraggingMask && enableMaskControl && onMaskPositionChange && maskPosition) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = (touch.clientX - dragStart.x) / rect.width;
      const dy = (touch.clientY - dragStart.y) / rect.height;
      
      // Update mask position with limited range
      const newX = Math.max(-0.5, Math.min(0.5, initialMaskPos.x + dx));
      const newY = Math.max(-0.5, Math.min(0.5, initialMaskPos.y + dy));
      
      onMaskPositionChange({ x: newX, y: newY });
      return;
    }
    
    // Handle mask resizing on touch
    if (isResizingMask && enableMaskControl && onMaskScaleChange) {
      const deltaX = touch.clientX - dragStart.x;
      // Calculate scale change based on drag distance
      const scaleChange = deltaX * 0.01;
      const newScale = Math.max(0.5, Math.min(2, initialMaskScale + scaleChange));
      
      onMaskScaleChange(newScale);
      return;
    }
    
    if (isDragging && enableZoom && interactionMode === 'zoom') {
      // Handle touch panning
      const dx = touch.clientX - dragStart.x;
      const dy = touch.clientY - dragStart.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else if (activeLandmark !== null && onLandmarkMove) {
      // Handle landmark dragging on touch
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / scale - offset.x / scale;
      const y = (touch.clientY - rect.top) / scale - offset.y / scale;
      
      onLandmarkMove(activeLandmark, x, y);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsDraggingMask(false);
    setIsResizingMask(false);
    setActiveLandmark(null);
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const toggleInteractionMode = () => {
    setInteractionMode(prev => prev === 'zoom' ? 'mask' : 'zoom');
  };

  const canvasTransform = enableZoom ? `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` : undefined;
  
  // Determine cursor style based on interaction mode and state
  const getCursorStyle = () => {
    if (enableMaskControl && interactionMode === 'mask') {
      if (isDraggingMask) return 'grabbing';
      if (isResizingMask) return 'nwse-resize';
      return 'pointer';
    }
    
    if (enableZoom && interactionMode === 'zoom') {
      return isDragging ? 'grabbing' : 'grab';
    }
    
    return 'default';
  };

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
              cursor: getCursorStyle(),
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
          
          {/* Control buttons */}
          {(enableZoom || enableMaskControl) && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {enableZoom && (
                <>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className={`w-8 h-8 ${interactionMode === 'zoom' ? 'bg-primary text-white' : 'bg-white/90 hover:bg-white'}`}
                    onClick={() => setInteractionMode('zoom')}
                    title="Zoom Mode"
                  >
                    <ZoomIn size={16} />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="w-8 h-8 bg-white/90 hover:bg-white"
                    onClick={handleZoomIn}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="w-8 h-8 bg-white/90 hover:bg-white"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </Button>
                  <Button 
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 bg-white/90 hover:bg-white"
                    onClick={handleReset}
                    title="Reset View"
                  >
                    <Move size={16} />
                  </Button>
                </>
              )}
              
              {enableMaskControl && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className={`w-8 h-8 ${interactionMode === 'mask' ? 'bg-primary text-white' : 'bg-white/90 hover:bg-white'}`}
                  onClick={() => setInteractionMode('mask')}
                  title="Mask Control Mode"
                >
                  <Square size={16} />
                </Button>
              )}
            </div>
          )}
          
          {/* Mask indicator overlay when in mask control mode */}
          {enableMaskControl && interactionMode === 'mask' && faceDetection && maskPosition && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="text-xs bg-black/50 text-white p-1 rounded absolute top-2 left-2">
                Mask Control Mode - Drag to position, edges to resize
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ImagePreview.displayName = 'ImagePreview';

export default ImagePreview;
