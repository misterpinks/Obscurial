
import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface UseImageProcessingProps {
  originalImage: HTMLImageElement | null;
  originalCanvasRef: React.RefObject<HTMLCanvasElement>;
  processedCanvasRef: React.RefObject<HTMLCanvasElement>;
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetection: any;
  sliderValues: Record<string, number>;
  initialProcessingDone: boolean;
  showLandmarks: boolean;
  isFaceApiLoaded: boolean;
  detectFaces: () => void;
  analyzeModifiedImage: () => void;
  autoAnalyze: boolean;
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
  autoAnalyze
}: UseImageProcessingProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>("");
  const lastProcessedValuesRef = useRef<string>("");
  
  // Force initial processing when face detection completes
  useEffect(() => {
    if (initialProcessingDone && originalImage && faceDetection) {
      processImage();
    }
  }, [initialProcessingDone, faceDetection]);

  // Process when sliders change or when landmarks toggle changes
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      // Check if values have actually changed to avoid unnecessary processing
      const currentValuesString = JSON.stringify(sliderValues);
      if (currentValuesString !== lastProcessedValuesRef.current) {
        processImage();
        lastProcessedValuesRef.current = currentValuesString;
      }
    }
  }, [sliderValues, showLandmarks, originalImage]);

  // Also make sure we process when face detection changes
  useEffect(() => {
    if (faceDetection && originalImage && initialProcessingDone) {
      processImage();
    }
  }, [faceDetection]);

  // Track when images change to ensure we process
  useEffect(() => {
    if (originalImage) {
      // Reset processed state when image changes
      lastProcessedValuesRef.current = "";
    }
  }, [originalImage]);

  const processImage = () => {
    if (!originalImage || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) return;
    
    setIsProcessing(true);
    
    // Use requestAnimationFrame to ensure smooth UI
    requestAnimationFrame(() => {
      try {
        // Process the image
        // Implementation details will depend on your image processing logic
        
        // Update clean processed image URL for download
        const cleanCanvas = cleanProcessedCanvasRef.current;
        if (cleanCanvas) {
          setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
        }
        
        // If we have face data and auto-analyze is enabled, analyze the modified image
        if (faceDetection && isFaceApiLoaded && autoAnalyze) {
          setTimeout(analyzeModifiedImage, 100);
        }
        
      } catch (error) {
        console.error("Error processing image:", error);
        toast({
          variant: "destructive",
          title: "Processing Error",
          description: "Failed to process the image."
        });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const downloadImage = () => {
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
  };

  return {
    isProcessing,
    cleanProcessedImageURL,
    processImage,
    downloadImage,
  };
};
