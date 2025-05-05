
import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Upload, Download, ImageIcon, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ModelSetup from '../ModelSetup';
import ImageUploader from './ImageUploader';
import WebcamCapture from './WebcamCapture';
import ImagePreview from './ImagePreview';
import FaceAnalysis from './FaceAnalysis';
import AdjustmentSliders from './AdjustmentSliders';
import RandomizeButton from './RandomizeButton';
import EditorImageControls from './EditorImageControls';
import EditorHeader from './EditorHeader';
import {
  useFaceApiModels,
  useFeatureSliders,
  useFaceAnalysis
} from './FacialEditorHooks';
import {
  drawFaceLandmarks,
  applyFeatureTransformations
} from './ImageProcessingUtils';

const FacialEditor = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processedImageURL, setProcessedImageURL] = useState<string>("");
  const [cleanProcessedImageURL, setCleanProcessedImageURL] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasShownNoFaceToast, setHasShownNoFaceToast] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cleanProcessedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Custom hooks for models loading, facial processing, and sliders
  const { isFaceApiLoaded, modelsLoadingStatus } = useFaceApiModels();
  const { featureSliders, sliderValues, handleSliderChange, resetSliders, randomizeSliders } = useFeatureSliders();
  const {
    isAnalyzing,
    faceDetection,
    facialDifference,
    initialProcessingDone,
    detectFaces,
    analyzeModifiedImage,
    setInitialProcessingDone,
    setFaceDetection,
    imageDimensions
  } = useFaceAnalysis(isFaceApiLoaded, originalImage, cleanProcessedCanvasRef);

  // Display the original image immediately after loading
  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        // Set canvas dimensions to match image
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        
        // Draw the image to canvas
        origCtx.clearRect(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height);
        origCtx.drawImage(originalImage, 0, 0);
        console.log("Drawing original image to canvas", originalImage.width, originalImage.height);
      }
      
      // After displaying original image, proceed with initial processing
      if (isFaceApiLoaded) {
        detectFaces();
      }
    }
  }, [originalImage, detectFaces, isFaceApiLoaded]);
  
  // Process the image whenever slider values change - but don't run analysis automatically
  useEffect(() => {
    if (originalImage && initialProcessingDone) {
      processImage();
    }
  }, [sliderValues, originalImage, initialProcessingDone, showLandmarks]);

  // When face-api loads and we have an original image, detect features
  useEffect(() => {
    if (isFaceApiLoaded && originalImage && !initialProcessingDone) {
      // Reset detection state before attempting a new detection
      setFaceDetection(null);
      detectFaces();
    }
  }, [isFaceApiLoaded, originalImage, initialProcessingDone, detectFaces, setFaceDetection]);

  // Clean up webcam stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Stop webcam if switching away from webcam tab
    if (value !== "webcam" && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      streamRef.current = null;
    }
  };

  const captureFromWebcam = () => {
    if (!videoRef.current || !streamRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setActiveTab("edit");
        
        // Reset detection states when capturing a new image
        setFaceDetection(null);
        setInitialProcessingDone(false);
        setHasShownNoFaceToast(false);
      };
      img.src = canvas.toDataURL("image/png");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select an image file."
      });
      return;
    }
    
    // Reset states when loading a new image
    setFaceDetection(null);
    setInitialProcessingDone(false);
    setHasShownNoFaceToast(false);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setActiveTab("edit");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle direct landmark manipulation
  const handleLandmarkMove = (pointIndex: number, x: number, y: number) => {
    if (!faceDetection?.landmarks) return;
    
    // Create a deep copy of the face detection object to avoid mutation issues
    const updatedFaceDetection = JSON.parse(JSON.stringify(faceDetection));
    
    // Update the landmark position
    updatedFaceDetection.landmarks.positions[pointIndex] = { x, y };
    
    // Update state with modified face detection
    setFaceDetection(updatedFaceDetection);
    
    // Reprocess the image
    processImage();
  };

  const processImage = () => {
    if (!originalImage || !processedCanvasRef.current || !cleanProcessedCanvasRef.current) return;
    
    setIsProcessing(true);
    
    // First process the clean canvas (without landmarks)
    const cleanCanvas = cleanProcessedCanvasRef.current;
    const cleanCtx = cleanCanvas.getContext("2d");
    if (!cleanCtx) return;
    
    // Set canvas dimensions to match image
    cleanCanvas.width = originalImage.width;
    cleanCanvas.height = originalImage.height;
    
    // Apply feature transformations to the clean canvas
    applyFeatureTransformations({
      ctx: cleanCtx,
      originalImage, 
      width: cleanCanvas.width, 
      height: cleanCanvas.height, 
      faceDetection, 
      sliderValues
    });
    
    // Update clean processed image URL for download
    setCleanProcessedImageURL(cleanCanvas.toDataURL("image/png"));
    
    // Now process the canvas with landmarks
    const canvas = processedCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas dimensions to match image
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    
    // Copy the clean processed image to the display canvas
    ctx.drawImage(cleanCanvas, 0, 0);
    
    // Draw landmarks on top of the processed image if showLandmarks is true
    if (faceDetection && showLandmarks) {
      drawFaceLandmarks(canvas, faceDetection, originalImage);
    }
    
    // Update processed image URL (with or without landmarks)
    setProcessedImageURL(canvas.toDataURL("image/png"));
    setIsProcessing(false);
  };

  const handleRunAnalysis = () => {
    if (faceDetection && isFaceApiLoaded) {
      analyzeModifiedImage();
      
      toast({
        title: "Analysis Started",
        description: "Analyzing facial changes..."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Analyze",
        description: "No face was detected in the original image."
      });
    }
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

  const toggleLandmarks = () => {
    setShowLandmarks(!showLandmarks);
  };

  // Fixed function to properly trigger file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EditorHeader />

      {modelsLoadingStatus === 'error' && <ModelSetup />}

      <Tabs defaultValue="upload" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="webcam">
            <Camera className="h-4 w-4 mr-2" />
            Webcam
          </TabsTrigger>
          <TabsTrigger value="edit" disabled={!originalImage}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="flex flex-col items-center justify-center">
          <ImageUploader onImageUpload={handleImageUpload} />
        </TabsContent>

        <TabsContent value="webcam" className="flex flex-col items-center justify-center">
          <WebcamCapture 
            onCapture={captureFromWebcam}
            videoRef={videoRef}
            streamRef={streamRef}
          />
        </TabsContent>

        <TabsContent value="edit">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - original, processed with landmarks, and clean images */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImagePreview 
                  title="Original"
                  canvasRef={originalCanvasRef}
                  originalImage={originalImage}
                />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Modified {showLandmarks ? 'with Landmarks' : ''}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs">{showLandmarks ? <Eye size={14} /> : <EyeOff size={14} />}</span>
                      <Switch 
                        checked={showLandmarks} 
                        onCheckedChange={toggleLandmarks}
                        size="sm"
                      />
                    </div>
                  </div>
                  <ImagePreview
                    title=""
                    canvasRef={processedCanvasRef}
                    isProcessing={isProcessing}
                    isAnalyzing={isAnalyzing}
                    noFaceDetected={!faceDetection && !isAnalyzing && initialProcessingDone}
                    originalImage={originalImage}
                    enableZoom={true}
                    onLandmarkMove={handleLandmarkMove}
                    faceDetection={faceDetection}
                  />
                </div>
                
                <ImagePreview
                  title="Clean Result"
                  canvasRef={cleanProcessedCanvasRef}
                  originalImage={originalImage}
                />
              </div>
              
              {/* Analysis information below images - always show if we have an image */}
              <FaceAnalysis 
                confidence={faceDetection?.confidence} 
                facialDifference={facialDifference}
                isAnalyzing={isAnalyzing}
                onRunAnalysis={handleRunAnalysis}
                imageDimensions={imageDimensions}
              />
              
              <EditorImageControls
                triggerFileInput={triggerFileInput}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                downloadImage={downloadImage}
                hasProcessedImage={!!cleanProcessedImageURL}
              />
            </div>
            
            {/* Right side - adjustment sliders */}
            <div className="space-y-4">
              <RandomizeButton onRandomize={randomizeSliders} />
              
              <AdjustmentSliders 
                featureSliders={featureSliders}
                sliderValues={sliderValues}
                onSliderChange={handleSliderChange}
                onReset={() => {
                  resetSliders();
                  toast({
                    title: "Settings Reset",
                    description: "All adjustments have been reset to default values."
                  });
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacialEditor;
