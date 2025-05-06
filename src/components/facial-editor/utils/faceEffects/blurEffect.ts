
/**
 * Apply gaussian blur to a specific region of canvas
 */
export const applyBlur = (
  ctx: CanvasRenderingContext2D,
  x: number, 
  y: number, 
  width: number, 
  height: number,
  blurAmount: number
) => {
  if (blurAmount <= 0) return;
  
  // Increase blur intensity by multiplying by 3x
  const enhancedBlurAmount = blurAmount * 3;
  
  // Save the current canvas state
  ctx.save();
  
  try {
    // Apply the blur filter with enhanced amount
    ctx.filter = `blur(${enhancedBlurAmount}px)`;
    
    // Create a temporary canvas to hold the blurred region
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    if (!tempCtx) return;
    
    // Copy the region to blur to the temporary canvas
    tempCtx.drawImage(
      ctx.canvas, 
      x, y, width, height,
      0, 0, width, height
    );
    
    // Draw the blurred version back to the original canvas
    ctx.drawImage(tempCanvas, x, y);
  } finally {
    // Reset the filter and restore canvas state
    ctx.filter = 'none';
    ctx.restore();
  }
};
