
/**
 * Canvas utility functions for image operations
 */

// Helper to create image from canvas
export const createImageFromCanvas = (canvas: HTMLCanvasElement): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = canvas.toDataURL('image/png');
  });
};

// Helper to get canvas dimensions
export const getCanvasDimensions = (canvas: HTMLCanvasElement) => {
  return {
    width: canvas.width,
    height: canvas.height
  };
};
