
// Import any required dependencies here
import { FaceDetection } from '../hooks/types';

// Define interfaces for the parameters
interface TransformationParams {
  ctx: CanvasRenderingContext2D;
  originalImage: HTMLImageElement;
  width: number;
  height: number;
  faceDetection: FaceDetection | null;
  sliderValues: Record<string, number>;
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  };
  worker?: Worker;
}

export const applyFeatureTransformations = ({
  ctx,
  originalImage,
  width,
  height,
  faceDetection,
  sliderValues = {},
  faceEffectOptions = { effectType: 'none', effectIntensity: 0 },
  worker
}: TransformationParams): void => {
  console.log("Applying feature transformations");
  
  // Set canvas dimensions to match image
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  
  // Draw original to canvas first (as a base)
  ctx.drawImage(originalImage, 0, 0);

  // Check if we need to do any processing at all
  const needsProcessing = Object.keys(sliderValues).some(key => sliderValues[key] !== 0);
  
  // If no slider values are set, just return with the original image
  if (!needsProcessing && faceEffectOptions.effectType === 'none') {
    return;
  }

  // Try to use the worker if available, otherwise process in main thread
  if (worker) {
    try {
      console.log("Using worker for image processing with values:", sliderValues);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, width, height);
      
      // Define a timeout for worker processing
      const timeout = 5000; // 5 seconds
      let timeoutId: number | null = null;
      
      // Set up one-time message handler
      const onMessage = (e: MessageEvent) => {
        // Clear the timeout
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        
        worker.removeEventListener('message', onMessage);
        
        if (e.data.error) {
          console.error("Worker processing error:", e.data.error);
          // No need to redraw - we already drew the original image
        } else if (e.data.processedData && e.data.width && e.data.height) {
          console.log("Worker processing completed in", e.data.processingTime, "ms");
          
          try {
            // Create a new image data object from the processed data
            const processedImageData = new ImageData(
              new Uint8ClampedArray(e.data.processedData),
              e.data.width,
              e.data.height
            );
            
            // Put the processed image data to the canvas
            ctx.putImageData(processedImageData, 0, 0);
            console.log("Successfully applied processed image to canvas");
          } catch (err) {
            console.error("Error applying processed image to canvas:", err);
          }
        }
      };
      
      // Listen for the response
      worker.addEventListener('message', onMessage);
      
      // Set up timeout to handle worker not responding
      timeoutId = window.setTimeout(() => {
        console.warn("Worker processing timed out");
        worker.removeEventListener('message', onMessage);
      }, timeout);
      
      // Send the image data to the worker
      worker.postMessage({
        command: 'process',
        originalImageData: {
          data: imageData.data,
          width,
          height
        },
        params: {
          sliderValues,
          faceDetection: faceDetection ? {
            landmarks: faceDetection.landmarks ? true : false,
            detection: faceDetection.detection ? {
              box: faceDetection.detection.box
            } : null
          } : null,
          faceEffectOptions
        }
      });
    } catch (error) {
      console.error("Error setting up worker:", error);
      // Process in main thread as fallback
      applyBasicTransformations(ctx, originalImage, sliderValues);
    }
  } else {
    console.log("No worker available, processing in main thread");
    // Apply basic transformations in the main thread
    applyBasicTransformations(ctx, originalImage, sliderValues);
  }
};

// Apply very basic transformations in the main thread (fallback)
function applyBasicTransformations(
  ctx: CanvasRenderingContext2D, 
  originalImage: HTMLImageElement,
  sliderValues: Record<string, number>
) {
  // Get current canvas size
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Just draw the original image first
  ctx.drawImage(originalImage, 0, 0);
  
  // Only apply filters if we have slider values
  if (Object.keys(sliderValues).length > 0) {
    try {
      // Apply simple CSS filters for quick visualization
      const brightness = 1 + (sliderValues.brightness || 0) / 100;
      const contrast = 1 + (sliderValues.contrast || 0) / 100;
      const saturation = 1 + (sliderValues.saturation || 0) / 100;
      const blur = (sliderValues.blur || 0) / 10;
      
      // Apply filters using CSS filter
      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`;
      
      // Redraw with filters
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(originalImage, 0, 0);
      
      // Reset filter
      ctx.filter = 'none';
    } catch (error) {
      console.error("Error applying basic transformations:", error);
    }
  }
}
