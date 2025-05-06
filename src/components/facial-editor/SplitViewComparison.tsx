
import React, { useEffect, useRef, useState } from 'react';
import { SplitViewMode } from './hooks/useSplitView';

interface SplitViewComparisonProps {
  originalCanvas: React.RefObject<HTMLCanvasElement>;
  processedCanvas: React.RefObject<HTMLCanvasElement>;
  mode: SplitViewMode;
  splitPosition: number;
  onSplitPositionChange: (position: number) => void;
}

const SplitViewComparison: React.FC<SplitViewComparisonProps> = ({
  originalCanvas,
  processedCanvas,
  mode,
  splitPosition,
  onSplitPositionChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Render the split view
  useEffect(() => {
    if (!canvasRef.current || !originalCanvas.current || !processedCanvas.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const originalCtx = originalCanvas.current.getContext('2d');
    const processedCtx = processedCanvas.current.getContext('2d');
    if (!originalCtx || !processedCtx) return;

    // Set canvas dimensions
    canvas.width = originalCanvas.current.width;
    canvas.height = originalCanvas.current.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get image data
    const originalImage = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
    const processedImage = processedCtx.getImageData(0, 0, canvas.width, canvas.height);

    // Calculate split position in pixels
    const splitX = Math.floor(canvas.width * splitPosition);
    const splitY = Math.floor(canvas.height * splitPosition);

    // Create a new ImageData object for the combined view
    const combinedImage = ctx.createImageData(canvas.width, canvas.height);

    // Split images based on mode
    if (mode === SplitViewMode.HORIZONTAL) {
      // Draw original on left, processed on right
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const sourceImage = x < splitX ? originalImage : processedImage;
          
          combinedImage.data[i] = sourceImage.data[i];
          combinedImage.data[i + 1] = sourceImage.data[i + 1];
          combinedImage.data[i + 2] = sourceImage.data[i + 2];
          combinedImage.data[i + 3] = sourceImage.data[i + 3];
        }
      }
    } else if (mode === SplitViewMode.VERTICAL) {
      // Draw original on top, processed on bottom
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const sourceImage = y < splitY ? originalImage : processedImage;
          
          combinedImage.data[i] = sourceImage.data[i];
          combinedImage.data[i + 1] = sourceImage.data[i + 1];
          combinedImage.data[i + 2] = sourceImage.data[i + 2];
          combinedImage.data[i + 3] = sourceImage.data[i + 3];
        }
      }
    } else if (mode === SplitViewMode.DIAGONAL) {
      // Draw original in top-left, processed in bottom-right
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          // Determine if this pixel is above or below the diagonal line
          const normalizedX = x / canvas.width;
          const normalizedY = y / canvas.height;
          const sourceImage = normalizedX + normalizedY < splitPosition * 2 ? originalImage : processedImage;
          
          combinedImage.data[i] = sourceImage.data[i];
          combinedImage.data[i + 1] = sourceImage.data[i + 1];
          combinedImage.data[i + 2] = sourceImage.data[i + 2];
          combinedImage.data[i + 3] = sourceImage.data[i + 3];
        }
      }
    }

    // Put the combined image data onto the canvas
    ctx.putImageData(combinedImage, 0, 0);

    // Draw divider line
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // Draw split line based on mode
    ctx.beginPath();
    if (mode === SplitViewMode.HORIZONTAL) {
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, canvas.height);
    } else if (mode === SplitViewMode.VERTICAL) {
      ctx.moveTo(0, splitY);
      ctx.lineTo(canvas.width, splitY);
    } else if (mode === SplitViewMode.DIAGONAL) {
      ctx.moveTo(0, canvas.height * splitPosition * 2);
      ctx.lineTo(canvas.width * splitPosition * 2, 0);
    }
    ctx.stroke();

    // Draw handle for dragging
    if (mode === SplitViewMode.HORIZONTAL) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(splitX, canvas.height / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.stroke();
    } else if (mode === SplitViewMode.VERTICAL) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, splitY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

  }, [originalCanvas, processedCanvas, mode, splitPosition]);

  // Handle mouse/touch interactions for dragging the split
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSplitPosition(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updateSplitPosition(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateSplitPosition = (e: React.PointerEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (mode === SplitViewMode.HORIZONTAL) {
      const newPosition = (e.clientX - rect.left) / rect.width;
      onSplitPositionChange(newPosition);
    } else if (mode === SplitViewMode.VERTICAL) {
      const newPosition = (e.clientY - rect.top) / rect.height;
      onSplitPositionChange(newPosition);
    } else if (mode === SplitViewMode.DIAGONAL) {
      // Calculate position based on both X and Y
      const newX = (e.clientX - rect.left) / rect.width;
      const newY = (e.clientY - rect.top) / rect.height;
      onSplitPositionChange((newX + newY) / 2);
    }
  };

  // Label styles
  const labelStyles = {
    position: 'absolute',
    background: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  } as React.CSSProperties;

  return (
    <div 
      ref={containerRef}
      className="relative rounded-lg overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas 
        ref={canvasRef}
        className="max-w-full max-h-full"
      />
      
      {/* Labels */}
      {mode === SplitViewMode.HORIZONTAL && (
        <>
          <div style={{ ...labelStyles, top: '10px', left: '10px' }}>
            Original
          </div>
          <div style={{ ...labelStyles, top: '10px', right: '10px' }}>
            Modified
          </div>
        </>
      )}
      
      {mode === SplitViewMode.VERTICAL && (
        <>
          <div style={{ ...labelStyles, top: '10px', left: '10px' }}>
            Original
          </div>
          <div style={{ ...labelStyles, bottom: '10px', left: '10px' }}>
            Modified
          </div>
        </>
      )}
      
      {mode === SplitViewMode.DIAGONAL && (
        <>
          <div style={{ ...labelStyles, top: '10px', left: '10px' }}>
            Original
          </div>
          <div style={{ ...labelStyles, bottom: '10px', right: '10px' }}>
            Modified
          </div>
        </>
      )}
    </div>
  );
};

export default SplitViewComparison;
