
import { useState, useRef, useEffect } from 'react';

export const useCanvasInteraction = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  enableZoom: boolean,
  faceDetection: any,
  maskPosition?: { x: number, y: number },
  onMaskPositionChange?: (position: { x: number, y: number }) => void,
  onMaskScaleChange?: (scale: number) => void,
  onLandmarkMove?: (pointIndex: number, x: number, y: number) => void,
  maskScale?: number
) => {
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragPoint, setDragPoint] = useState<number | null>(null);
  const [isDraggingMask, setIsDraggingMask] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const wheelEvtOpts = useRef<AddEventListenerOptions>({ passive: false });
  
  // Add wheel event listener with non-passive option for zooming
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

  // Handle keyboard shortcuts for mask scaling
  useEffect(() => {
    if (!onMaskScaleChange || !maskScale) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onMaskScaleChange(maskScale * 1.1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        onMaskScaleChange(maskScale * 0.9);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMaskScaleChange, maskScale]);

  // Handle mouse down for dragging landmarks or mask
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    if (!onLandmarkMove && !faceDetection?.landmarks && !maskPosition && !onMaskPositionChange) {
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas, accounting for scale
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Check if we're near any landmark point
    const pointSize = 10; // Detection radius (larger than drawn point)
    
    if (maskPosition && onMaskPositionChange && canvas) {
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
    
    // Check landmarks only if not dragging mask and if landmarks exist
    if (faceDetection?.landmarks?.positions) {
      const landmarks = faceDetection.landmarks.positions;
      for (let i = 0; i < landmarks.length; i++) {
        const point = landmarks[i];
        if (Math.abs(x - point._x) < pointSize && Math.abs(y - point._y) < pointSize) {
          setDragging(true);
          setDragPoint(i);
          break;
        }
      }
    }
  };

  // Handle mouse move for dragging landmarks or mask
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
    if (faceDetection?.landmarks?.positions) {
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

  return {
    scale,
    hoveredPoint,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  };
};
