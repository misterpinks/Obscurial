
import { useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { useToast } from "@/components/ui/use-toast";
import { createImageFromCanvas } from '../utils/canvasUtils';

export interface FaceDetection {
  landmarks?: any;
  detection?: any;
  confidence?: number;
  original?: any;
  modified?: any;
}

export const useFaceAnalysis = (
  isFaceApiLoaded: boolean,
  originalImage: HTMLImageElement | null,
  cleanProcessedCanvasRef: React.RefObject<HTMLCanvasElement>
) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [facialDifference, setFacialDifference] = useState<number | null>(null);
  const [initialProcessingDone, setInitialProcessingDone] = useState(false);
  const [hasShownNoFaceToast, setHasShownNoFaceToast] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Use memoized detection options to prevent recreating objects
  const detectionOptions = useCallback(() => {
    return new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 });
  }, []);

  const detectFaces = async () => {
    if (!originalImage || !isFaceApiLoaded) return;
    
    try {
      setIsAnalyzing(true);
      
      // Update image dimensions when detecting faces
      setImageDimensions({
        width: originalImage.width,
        height: originalImage.height
      });
      
      // Downsample very large images for faster processing
      // Only apply downsampling if the image is significantly large
      let processImage = originalImage;
      let scaleFactor = 1;
      
      if (originalImage.width > 1200 || originalImage.height > 1200) {
        const maxDimension = Math.max(originalImage.width, originalImage.height);
        scaleFactor = 1200 / maxDimension;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalImage.width * scaleFactor;
        tempCanvas.height = originalImage.height * scaleFactor;
        
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);
          processImage = await createImageFromCanvas(tempCanvas);
          console.log('Image downsampled for faster processing');
        }
      }
      
      // Use the detection options callback
      const detections = await faceapi
        .detectSingleFace(processImage, detectionOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      setIsAnalyzing(false);
      
      if (detections) {
        console.log("Face detected with confidence:", detections.detection.score);
        
        // Scale landmarks back if image was downsampled
        if (scaleFactor !== 1) {
          // Scale up detection box
          const scaledBox = {
            ...detections.detection.box,
            x: detections.detection.box.x / scaleFactor,
            y: detections.detection.box.y / scaleFactor,
            width: detections.detection.box.width / scaleFactor,
            height: detections.detection.box.height / scaleFactor
          };
          
          // Scale up landmarks
          const scaledLandmarks = new faceapi.FaceLandmarks68(
            detections.landmarks.positions.map((pt: any) => {
              return { x: pt.x / scaleFactor, y: pt.y / scaleFactor };
            }),
            { width: originalImage.width, height: originalImage.height }
          );
          
          setFaceDetection({
            landmarks: scaledLandmarks,
            detection: { ...detections.detection, box: scaledBox },
            confidence: detections.detection.score,
            original: detections.descriptor
          });
        } else {
          setFaceDetection({
            landmarks: detections.landmarks,
            detection: detections.detection,
            confidence: detections.detection.score,
            original: detections.descriptor
          });
        }
        
        setHasShownNoFaceToast(false);
        // Ensure the image is processed after detection completes
        setInitialProcessingDone(true);
      } else {
        console.log("No face detected in the image");
        setFaceDetection(null);
        
        if (!hasShownNoFaceToast) {
          toast({
            variant: "destructive",
            title: "No Face Detected",
            description: "Try uploading a clearer image with a face."
          });
          setHasShownNoFaceToast(true);
        }
        
        // Even if no face is detected, we should still process the image to show it
        setInitialProcessingDone(true);
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      setIsAnalyzing(false);
      setFaceDetection(null);
      
      if (!hasShownNoFaceToast) {
        toast({
          variant: "destructive",
          title: "Face Detection Error",
          description: "Could not analyze facial features."
        });
        setHasShownNoFaceToast(true);
      }
      
      // Even if face detection fails, we should still process the image to show it
      setInitialProcessingDone(true);
    }
  };

  const analyzeModifiedImage = async () => {
    if (!cleanProcessedCanvasRef.current || !isFaceApiLoaded) return;
    
    try {
      setIsAnalyzing(true);
      
      const processedImage = await createImageFromCanvas(cleanProcessedCanvasRef.current);
      
      // Use the same lower confidence threshold for consistency
      const detections = await faceapi
        .detectSingleFace(processedImage, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (detections && faceDetection) {
        // Update state with modified face descriptor
        setFaceDetection(prev => ({
          ...prev!,
          modified: detections.descriptor
        }));
        
        // Calculate similarity between original and modified faces
        if (faceDetection.original) {
          // Improved facial difference calculation
          // The euclideanDistance typically returns values between 0-1 for similar faces
          // and larger values for different faces. We need to enhance this difference
          // to better reflect visual changes
          const distance = faceapi.euclideanDistance(
            faceDetection.original, 
            detections.descriptor
          );
          
          // Apply a non-linear transformation to emphasize differences
          // This will make small changes more noticeable in the score
          const enhancedDistance = Math.pow(distance * 4, 1.5);
          const clampedDistance = Math.min(enhancedDistance, 2.0);
          
          console.log("Raw facial difference:", distance);
          console.log("Enhanced facial difference:", clampedDistance);
          setFacialDifference(clampedDistance);
        }
      } else {
        console.log("No face detected in modified image - this is good for anti-recognition");
        // If no face is detected in the modified image, that's actually good for defeating recognition
        setFacialDifference(2.0); // Maximum difference - recognition fully defeated
        toast({
          title: "Recognition Defeated",
          description: "The face is no longer detectable by AI - excellent privacy protection!"
        });
      }

      setIsAnalyzing(false);
    } catch (error) {
      console.error("Error analyzing modified image:", error);
      setIsAnalyzing(false);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Could not analyze facial differences."
      });
    }
  };

  return { 
    isAnalyzing, 
    faceDetection, 
    facialDifference, 
    initialProcessingDone, 
    detectFaces, 
    analyzeModifiedImage,
    setInitialProcessingDone,
    setFaceDetection,
    imageDimensions,
    // Export these state values for use in parent component
    hasShownNoFaceToast,
    setHasShownNoFaceToast
  };
};
