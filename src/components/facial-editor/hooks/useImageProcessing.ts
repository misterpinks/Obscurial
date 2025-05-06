import { useState, useEffect, RefObject, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { applyFeatureTransformations } from '../utils/transformationEngine';
import debounce from 'lodash/debounce';

interface UseImageProcessingProps {
  originalImage: HTMLImageElement | null;
  originalCanvasRef: RefObject<HTMLCanvasElement>;
  processedCanvasRef: RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: RefObject<HTMLCanvasElement>;
  faceDetection: any;
  sliderValues: Record<string, number>;
  initialProcessingDone: boolean;
  showLandmarks: boolean;
  isFaceApiLoaded: boolean;
  detectFaces: () => void;
  analyzeModifiedImage: () => void;
  autoAnalyze: boolean;
  lastProcessedValues: string;
  setLastProcessedValues: (values: string) => void;
  faceEffectOptions?: {
    effectType: 'blur' | 'pixelate' | 'mask' | 'none';
    effectIntensity: number;
    maskImage?: HTMLImageElement | null;
    maskPosition?: { x: number, y: number };
    maskScale?: number;
  };
}

export const useImageProcessing = ({
  originalImage,
  originalCanvasRef,
  processedCanvasRef,
  cleanProcessedCanvasRef,
  faceDetection,
  sliderValues,
  initialProcessingDone,
  showLandmarks,
  isFaceApiLoaded,
  detectFaces,
  analyzeModifiedImage,
  autoAnalyze,
  lastProcessedValues,
  setLastProcessedValues,
  faceEffectOptions
}: UseImageProcessingProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>("");
  const [processingQueued, setProcessingQueued] = useState(false);

  // Draw landmarks on the processed canvas with updated colors
  const drawFaceLandmarks = useCallback(() => {
    if (!faceDetection?.landmarks || !processedCanvasRef.current || !originalImage) return;
    
    const canvas = processedCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Color coding by feature groups with updated colors
    const featureGroups = {
      eyes: { points: [0, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], color: '#1EAEDB' },
      nose: { points: [27, 28, 29, 30, 31, 32, 33, 34, 35], color: '#222222' },
      mouth: { points: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67], color: '#ea384c' },
      face: { points: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], color: '#F97316' }
    };
    
    // Draw face bounding box - light green
    ctx.strokeStyle = '#F2FCE2';
    ctx.lineWidth = 2;
    const box = faceDetection.detection.box;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // Draw all landmarks by feature group
    const landmarks = faceDetection.landmarks.positions;
    
    // Draw points for each feature group
    Object.entries(featureGroups).forEach(([groupName, group]) => {
      ctx.fillStyle = group.color;
      ctx.strokeStyle = group.color;
      
      // Connect points for better visualization
      if (group.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(landmarks[group.points[0]].x, landmarks[group.points[0]].y);
        
        for (let i = 1; i < group.points.length; i++) {
          ctx.lineTo(landmarks[group.points[i]].x, landmarks[group.points[i]].y);
        }
        
        // Close the path for face
        if (groupName === 'face') {
          ctx.closePath();
        }
        
        ctx.stroke();
      }
      
      // Draw points
      group.points.forEach(pointIdx => {
        ctx.beginPath();
        ctx.arc(landmarks[pointIdx].x, landmarks[pointIdx].y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }, [faceDetection, processedCanvasRef, originalImage]);

  // Debounced process function to prevent too many renders
  const debouncedProcess = useCallback(
    debounce(() => {
      if (processingQueued) {
        processImage();
        setProcessingQueued(false);
      }
    }, 150),
    [processingQueued]
  );

  // Process the image whenever slider values change or when face detection completes
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Check if values actually changed or if face effects changed
      const currentValuesString = JSON.stringify({
        sliders: sliderValues,
        effects: faceEffectOptions
      });
      
      if (currentValuesString !== lastProcessedValues) {
        // Queue processing instead of doing it immediately
        setProcessingQueued(true);
        setLastProcessedValues(currentValuesString);
      }
    }
  }, [sliderValues, originalImage, initialProcessingDone, lastProcessedValues, faceEffectOptions]);

  // Run the debounced processing when needed
  useEffect(() => {
    if (processingQueued) {
      debouncedProcess();
    }
  }, [processingQueued, debouncedProcess]);

  // Display the original image immediately after loading
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Draw the image to canvas
        origCtx.drawImage(originalImage, 0, 0);
      }
      
      // After displaying original image, proceed with initial processing
      if (isFaceApiLoaded) {
        detectFaces();
      }
    }
  }, [originalImage, isFaceApiLoaded, detectFaces]);

  // Add a new effect to process the image after face detection completes
  useEffect(() => {
    if (originalImage && faceDetection && initialProcessingDone) {
      // Process image immediately after face detection is done
      processImage();
    }
  }, [faceDetection, initialProcessingDone]);

  const processImage = useCallback(() => {
    if (!originalImage || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) return;
    
    setIsProcessing(true);
    
    // First process the clean canvas (without landmarks)
    const cleanCanvas = cleanProcessedCanvasRef.current;
    const cleanCtx = cleanCanvas.getContext("2d", { willReadFrequently: true });
    if (!cleanCtx) return;
    
    // Set canvas dimensions to match image
    cleanCanvas.width = originalImage.width;
    cleanCanvas.height = originalImage.height;
    
    // Apply feature transformations directly to the clean canvas
    applyFeatureTransformations({
      ctx: cleanCtx,
      originalImage,
      width: cleanCanvas.width,
      height: cleanCanvas.height,
      faceDetection,
      sliderValues,
      faceEffectOptions
    });
    
    // Update clean processed image URL for download
    // Use a timeout to allow the UI to update before generating the data URL
    setTimeout(() => {
      setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
    }, 0);
    
    // Now process the canvas with landmarks
    const canvas = processedCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas dimensions to match image
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    
    // Copy the clean processed image to the display canvas
    ctx.drawImage(cleanCanvas, 0, 0);
    
    // Draw landmarks on top of the processed image
    if (faceDetection && showLandmarks) {
      drawFaceLandmarks();
    }
    
    setIsProcessing(false);
    
    // If we have face data, analyze the modified image
    if (faceDetection && isFaceApiLoaded && autoAnalyze) {
      setTimeout(analyzeModifiedImage, 300);
    }
  }, [
    originalImage, 
    processedCanvasRef, 
    cleanProcessedCanvasRef, 
    faceDetection, 
    sliderValues, 
    showLandmarks, 
    isFaceApiLoaded, 
    autoAnalyze, 
    analyzeModifiedImage,
    drawFaceLandmarks,
    faceEffectOptions
  ]);

  const downloadImage = useCallback(() => {
    if (!cleanProcessedImageURL) return;
    
    const link = document.createElement("a");
    link.href = cleanProcessedImageURL;
    link.download = "privacy-protected-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Image Downloaded",
      description: "Your privacy-protected image has been saved."
    });
  }, [cleanProcessedImageURL, toast]);

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    downloadImage
  };
};
