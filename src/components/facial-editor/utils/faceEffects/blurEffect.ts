
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
  
  // Linear mapping of blur intensity (1-100) to actual blur pixels (1-30)
  // This ensures a more consistent and predictable blur effect
  const maxBlurPixels = 30;
  const enhancedBlurAmount = (blurAmount / 100) * maxBlurPixels;
  
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
    
    console.log(`Applied blur effect with amount: ${blurAmount}, pixels: ${enhancedBlurAmount}`);
  } catch (error) {
    console.error("Error applying blur effect:", error);
  } finally {
    // Reset the filter and restore canvas state
    ctx.filter = 'none';
    ctx.restore();
  }
};
