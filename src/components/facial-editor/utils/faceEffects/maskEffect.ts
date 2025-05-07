
/**
 * Apply a mask image to a face region with position and scale
 */
export const applyFaceMask = (
  ctx: CanvasRenderingContext2D,
  maskImage: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  position: { x: number, y: number } = { x: 0, y: 0 },
  scale: number = 1,
  opacity: number = 0.9
) => {
  // If no mask image is provided, do nothing
  if (!maskImage) {
    console.log("No mask image provided for applying mask effect");
    return;
  }
  
  // Save current canvas state
  ctx.save();
  
  try {
    // Set global alpha for the mask
    ctx.globalAlpha = opacity;
    
    // Calculate the adjusted position and size based on position and scale
    const adjustedX = x + (position.x * width);
    const adjustedY = y + (position.y * height);
    const adjustedWidth = width * scale;
    const adjustedHeight = height * scale;
    
    // Draw the mask image with position and scale adjustments
    ctx.drawImage(maskImage, adjustedX, adjustedY, adjustedWidth, adjustedHeight);
    
    console.log("Applied mask effect with position:", position, "and scale:", scale);
  } catch (error) {
    console.error("Error applying face mask:", error);
  } finally {
    // Restore canvas state
    ctx.restore();
  }
};
