
/**
 * Apply pixelation effect to a region with optimized performance
 */
export const applyPixelation = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelSize: number
) => {
  if (pixelSize <= 1) return;
  
  // Make pixel size more significant and ensure it's an integer
  const effectivePixelSize = Math.max(2, Math.round(pixelSize * 3));
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Get the image data for the region to be pixelated
    const imageData = ctx.getImageData(x, y, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!tempCtx) return;
    
    // Draw the original image to the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Clear the original area
    ctx.clearRect(x, y, width, height);
    
    // Draw the pixelated version
    for (let blockY = 0; blockY < height; blockY += effectivePixelSize) {
      for (let blockX = 0; blockX < width; blockX += effectivePixelSize) {
        // Calculate block size (handling edge cases)
        const blockWidth = Math.min(effectivePixelSize, width - blockX);
        const blockHeight = Math.min(effectivePixelSize, height - blockY);
        
        if (blockWidth <= 0 || blockHeight <= 0) continue;
        
        // Get the average color of the block
        const blockData = tempCtx.getImageData(blockX, blockY, blockWidth, blockHeight);
        const rgba = getAverageColor(blockData.data);
        
        // Fill the block with the average color
        ctx.fillStyle = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a / 255})`;
        ctx.fillRect(x + blockX, y + blockY, blockWidth, blockHeight);
      }
    }
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
