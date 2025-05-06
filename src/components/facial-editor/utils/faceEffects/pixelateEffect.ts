
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
  const effectivePixelSize = Math.max(2, Math.round(pixelSize * 3));
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Get the image data for the region to be pixelated
    let imageData;
    try {
      imageData = ctx.getImageData(safeX, safeY, safeWidth, safeHeight);
    } catch (error) {
      console.warn("Error getting image data for pixelation:", error);
      ctx.restore();
      return;
    }
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = safeWidth;
    tempCanvas.height = safeHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!tempCtx) {
      console.warn("Could not create temporary context for pixelation");
      ctx.restore();
      return;
    }
    
    // Draw the original image to the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Clear the original area
    ctx.clearRect(safeX, safeY, safeWidth, safeHeight);
    
    // Draw the pixelated version
    for (let blockY = 0; blockY < safeHeight; blockY += effectivePixelSize) {
      for (let blockX = 0; blockX < safeWidth; blockX += effectivePixelSize) {
        // Calculate block size (handling edge cases)
        const blockWidth = Math.min(effectivePixelSize, safeWidth - blockX);
        const blockHeight = Math.min(effectivePixelSize, safeHeight - blockY);
        
        if (blockWidth <= 0 || blockHeight <= 0) continue;
        
        try {
          // Get the average color of the block
          const blockData = tempCtx.getImageData(blockX, blockY, blockWidth, blockHeight);
          const rgba = getAverageColor(blockData.data);
          
          // Fill the block with the average color
          ctx.fillStyle = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a / 255})`;
          ctx.fillRect(safeX + blockX, safeY + blockY, blockWidth, blockHeight);
        } catch (error) {
          console.warn("Error processing pixel block:", error);
          // Continue processing other blocks
          continue;
        }
      }
    }
  } catch (error) {
    console.error("Error in pixelation effect:", error);
    // In case of error, we'll just exit gracefully without applying the effect
  } finally {
    // Restore the canvas state
    ctx.restore();
  }
};

/**
 * Helper function to get the average color from an array of pixel data
 */
function getAverageColor(data: Uint8ClampedArray) {
  let r = 0, g = 0, b = 0, a = 0, count = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    a += data[i + 3];
    count++;
  }
  
  if (count === 0) return { r: 0, g: 0, b: 0, a: 255 };
  
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
    a: Math.round(a / count)
  };
}
