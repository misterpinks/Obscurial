
import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { useToast } from "@/components/ui/use-toast";
import { loadModelsFromGitHub } from '@/utils/downloadModels';
import { createImageFromCanvas } from './ImageProcessingUtils';

interface FeatureSlider {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  category: string;
  color?: string;
}

interface FaceDetection {
  landmarks?: any;
  detection?: any;
  confidence?: number;
  original?: any;
  modified?: any;
}

export const useFaceApiModels = () => {
  const { toast } = useToast();
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);
  const [modelsLoadingStatus, setModelsLoadingStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsLoadingStatus('loading');
        
        // Try to load models directly from GitHub
        const success = await loadModelsFromGitHub();
        
        if (success) {
          setIsFaceApiLoaded(true);
          setModelsLoadingStatus('success');
          
          toast({
            title: "Face Recognition Models Loaded",
            description: "Ready to process facial features."
          });
        } else {
          setModelsLoadingStatus('error');
        }
      } catch (error) {
        console.error("Failed to load face-api models:", error);
        setModelsLoadingStatus('error');
        
        toast({
          variant: "destructive",
          title: "Failed to load face models",
          description: "Please try loading them manually."
        });
      }
    };

    loadModels();
  }, []);

  return { isFaceApiLoaded, modelsLoadingStatus };
};

export const useFeatureSliders = () => {
  // Feature adjustment sliders configuration with updated colors
  const featureSliders: FeatureSlider[] = [
    { id: 'eyeSize', name: 'Eye Size', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'eyeSpacing', name: 'Eye Spacing', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'eyebrowHeight', name: 'Eyebrow Height', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes', color: '#1EAEDB' },
    { id: 'noseWidth', name: 'Nose Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Nose', color: '#FEF7CD' },
    { id: 'noseLength', name: 'Nose Length', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Nose', color: '#FEF7CD' },
    { id: 'mouthWidth', name: 'Mouth Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Mouth', color: '#ea384c' },
    { id: 'mouthHeight', name: 'Mouth Height', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Mouth', color: '#ea384c' },
    { id: 'faceWidth', name: 'Face Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
    { id: 'chinShape', name: 'Chin Shape', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
    { id: 'jawline', name: 'Jawline', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face', color: '#F97316' },
    { id: 'noiseLevel', name: 'Noise Level', min: 0, max: 30, step: 1, defaultValue: 10, category: 'Privacy' },
  ];

  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    // Initialize all sliders with their default values
    return featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
  });

  const handleSliderChange = (id: string, value: number) => {
    setSliderValues((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const resetSliders = () => {
    const resetValues = featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
    
    setSliderValues(resetValues);
  };

  return { featureSliders, sliderValues, handleSliderChange, resetSliders };
};

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

  const detectFaces = async () => {
    if (!originalImage || !isFaceApiLoaded) return;
    
    try {
      setIsAnalyzing(true);
      
      const detections = await faceapi
        .detectSingleFace(originalImage, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      setIsAnalyzing(false);
      
      if (detections) {
        setFaceDetection({
          landmarks: detections.landmarks,
          detection: detections.detection,
          confidence: detections.detection.score,
          original: detections.descriptor
        });
        
        // Ensure the image is processed after detection completes
        setInitialProcessingDone(true);
      } else {
        toast({
          variant: "destructive",
          title: "No Face Detected",
          description: "Try uploading a clearer image with a face."
        });
        
        // Even if no face is detected, we should still process the image to show it
        setInitialProcessingDone(true);
      }
    } catch (error) {
      setIsAnalyzing(false);
      console.error("Error detecting face:", error);
      toast({
        variant: "destructive",
        title: "Face Detection Error",
        description: "Could not analyze facial features."
      });
      
      // Even if face detection fails, we should still process the image to show it
      setInitialProcessingDone(true);
    }
  };

  const analyzeModifiedImage = async () => {
    if (!cleanProcessedCanvasRef.current || !isFaceApiLoaded) return;
    
    try {
      const processedImage = await createImageFromCanvas(cleanProcessedCanvasRef.current);
      const detections = await faceapi
        .detectSingleFace(processedImage, new faceapi.TinyFaceDetectorOptions())
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
          const distance = faceapi.euclideanDistance(
            faceDetection.original, 
            detections.descriptor
          );
          
          setFacialDifference(distance);
        }
      }
    } catch (error) {
      console.error("Error analyzing modified image:", error);
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
    setFaceDetection
  };
};
