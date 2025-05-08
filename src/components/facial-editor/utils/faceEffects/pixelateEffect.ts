
/**
 * Apply pixelation effect to a region with optimized performance
 * and robust error handling to prevent crashes
 */
export const applyPixelation = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelSize: number
) => {
  // Safety checks to prevent crashes
  if (pixelSize <= 1) return;
  if (width <= 0 || height <= 0) return;
  
  // Ensure x and y are within bounds of canvas
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  // Adjust boundaries if needed to stay within canvas
  const safeX = Math.max(0, Math.min(x, canvasWidth));
  const safeY = Math.max(0, Math.min(y, canvasHeight));
  const safeWidth = Math.min(width, canvasWidth - safeX);
  const safeHeight = Math.min(height, canvasHeight - safeY);
  
  // Additional safety check after adjustments
  if (safeWidth <= 0 || safeHeight <= 0) return;
  
  // Make pixel size more significant and ensure it's an integer
  // Scale the pixel size linearly (1-100) to (2-25) for better control
  const maxPixelSize = 25;
  const effectivePixelSize = Math.max(2, Math.round((pixelSize / 100) * maxPixelSize));
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Method 1: Using standard canvas operations (more compatible with Electron)
    // Step down the resolution of the area by drawing it smaller then scaling back up
    const tempCanvas = document.createElement('canvas');
    const scaleFactor = 1 / effectivePixelSize;
    
    // Set the temporary canvas to a scaled-down size
    tempCanvas.width = Math.max(1, Math.floor(safeWidth * scaleFactor));
    tempCanvas.height = Math.max(1, Math.floor(safeHeight * scaleFactor));
    
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      console.warn("Could not create temporary context for pixelation");
      ctx.restore();
      return;
    }
    
    // Draw the original image scaled down
    tempCtx.drawImage(
      ctx.canvas,
      safeX, safeY, safeWidth, safeHeight,
      0, 0, tempCanvas.width, tempCanvas.height
    );
    
    // Clear the original area
    ctx.clearRect(safeX, safeY, safeWidth, safeHeight);
    
    // Draw the pixelated version back, scaled up
    ctx.imageSmoothingEnabled = false; // Ensure pixelated look
    ctx.drawImage(
      tempCanvas,
      0, 0, tempCanvas.width, tempCanvas.height,
      safeX, safeY, safeWidth, safeHeight
    );
    ctx.imageSmoothingEnabled = true; // Reset to default
    
    console.log(`Applied pixelation with size: ${pixelSize}, effective size: ${effectivePixelSize}`);
  } catch (error) {
    console.error("Error in pixelation effect:", error);
    // In case of error, we'll just exit gracefully without applying the effect
  } finally {
    // Restore the canvas state
    ctx.restore();
  }
};
