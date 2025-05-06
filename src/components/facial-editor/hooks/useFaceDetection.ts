
import { useState } from 'react';
import * as faceapi from 'face-api.js';
import { useToast } from "@/components/ui/use-toast";
import { createImageFromCanvas } from '../utils/canvasUtils';
import { FaceDetection } from './types';

export const useFaceDetection = (
  isFaceApiLoaded: boolean,
  originalImage: HTMLImageElement | null,
  setInitialProcessingDone: (value: boolean) => void,
  setHasShownNoFaceToast: (value: boolean) => void,
  hasShownNoFaceToast: boolean
) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Detection options with memoized approach
  const detectionOptions = () => {
    return new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 });
  };

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
          
          // Scale up landmarks - fix the type issue by using faceapi.Point
          const scaledPositions = detections.landmarks.positions.map((pt: faceapi.Point) => {
            return new faceapi.Point(pt.x / scaleFactor, pt.y / scaleFactor);
          });
          
          const scaledLandmarks = new faceapi.FaceLandmarks68(
            scaledPositions,
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

  return {
    isAnalyzing,
    faceDetection,
    setFaceDetection,
    detectFaces,
    imageDimensions
  };
};
