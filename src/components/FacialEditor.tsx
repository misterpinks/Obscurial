import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Upload, Download, ImageIcon, Circle } from "lucide-react";
import * as faceapi from 'face-api.js';
import ModelSetup from './ModelSetup';
import { loadModelsFromGitHub } from '@/utils/downloadModels';

interface FeatureSlider {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  category: string;
}

interface FaceDetection {
  landmarks?: any;
  detection?: any;
  confidence?: number;
  original?: any;
  modified?: any;
}

const FacialEditor = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processedImageURL, setProcessedImageURL] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [initialProcessingDone, setInitialProcessingDone] = useState(false);
  const [modelsLoadingStatus, setModelsLoadingStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Feature adjustment sliders configuration - range -50/50
  const featureSliders: FeatureSlider[] = [
    { id: 'eyeSize', name: 'Eye Size', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes' },
    { id: 'eyeSpacing', name: 'Eye Spacing', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes' },
    { id: 'eyebrowHeight', name: 'Eyebrow Height', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Eyes' },
    { id: 'noseWidth', name: 'Nose Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Nose' },
    { id: 'noseLength', name: 'Nose Length', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Nose' },
    { id: 'mouthWidth', name: 'Mouth Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Mouth' },
    { id: 'mouthHeight', name: 'Mouth Height', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Mouth' },
    { id: 'faceWidth', name: 'Face Width', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face' },
    { id: 'chinShape', name: 'Chin Shape', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face' },
    { id: 'jawline', name: 'Jawline', min: -50, max: 50, step: 1, defaultValue: 0, category: 'Face' },
    { id: 'noiseLevel', name: 'Noise Level', min: 0, max: 30, step: 1, defaultValue: 10, category: 'Privacy' },
  ];

  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    // Initialize all sliders with their default values
    return featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
  });

  // Load face-api.js models with improved approach
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

  // Process the image whenever slider values change or when a new image is loaded
  useEffect(() => {
    if (originalImage) {
      processImage();
    }
  }, [sliderValues, originalImage]);

  // When face-api loads and we have an original image, detect features
  useEffect(() => {
    if (isFaceApiLoaded && originalImage && !initialProcessingDone) {
      detectFaces();
    }
  }, [isFaceApiLoaded, originalImage, initialProcessingDone]);

  // Clean up webcam stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const detectFaces = async () => {
    if (!originalImage || !isFaceApiLoaded) return;
    
    try {
      const detections = await faceapi
        .detectSingleFace(originalImage, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (detections) {
        setFaceDetection({
          landmarks: detections.landmarks,
          detection: detections.detection,
          confidence: detections.detection.score,
          original: detections.descriptor
        });
        
        // After face detection is complete, draw landmarks on analysis canvas
        drawFaceLandmarks();
      } else {
        toast({
          variant: "destructive",
          title: "No Face Detected",
          description: "Try uploading a clearer image with a face."
        });
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      toast({
        variant: "destructive",
        title: "Face Detection Error",
        description: "Could not analyze facial features."
      });
    }
  };
  
  const drawFaceLandmarks = () => {
    if (!faceDetection?.landmarks || !analysisCanvasRef.current || !originalImage) return;
    
    const canvas = analysisCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    
    // Draw original image as background
    ctx.drawImage(originalImage, 0, 0);
    
    // Draw landmarks
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 1;
    
    // Draw face bounding box
    const box = faceDetection.detection.box;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // Draw all landmarks points
    const landmarks = faceDetection.landmarks.positions;
    landmarks.forEach((point: { x: number, y: number }) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw confidence score
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = '14px Arial';
    ctx.fillText(`Recognition confidence: ${Math.round(faceDetection.confidence * 100)}%`, 10, 20);
    
    // After modification, try to detect on modified image
    setTimeout(analyzeModifiedImage, 500);
  };
  
  const analyzeModifiedImage = async () => {
    if (!processedCanvasRef.current || !isFaceApiLoaded) return;
    
    try {
      const processedImage = await createImageFromCanvas(processedCanvasRef.current);
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
          
          // Update analysis canvas with distance info
          const ctx = analysisCanvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillText(`Facial difference: ${distance.toFixed(2)} (>0.6 likely defeats recognition)`, 10, 40);
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing modified image:", error);
    }
  };
  
  const createImageFromCanvas = (canvas: HTMLCanvasElement): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = canvas.toDataURL('image/png');
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Stop webcam if switching away from webcam tab
    if (value !== "webcam" && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      streamRef.current = null;
    } else if (value === "webcam") {
      startWebcam();
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      toast({
        variant: "destructive",
        title: "Webcam Error",
        description: "Unable to access webcam. Please check permissions."
      });
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
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setInitialProcessingDone(false);
        setActiveTab("edit");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processImage = () => {
    if (!originalImage || !processedCanvasRef.current) return;
    
    setIsProcessing(true);
    
    const canvas = processedCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas dimensions to match image
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    
    // Apply feature transformations based on slider values
    applyFeatureTransformations(ctx, canvas.width, canvas.height);
    
    // Update processed image URL
    setProcessedImageURL(canvas.toDataURL("image/png"));
    setIsProcessing(false);
    
    // Initial processing completed
    if (!initialProcessingDone) {
      setInitialProcessingDone(true);
    }
    
    // Also draw the original image on the reference canvas
    if (originalCanvasRef.current) {
      const origCtx = originalCanvasRef.current.getContext("2d");
      if (origCtx) {
        originalCanvasRef.current.width = originalImage.width;
        originalCanvasRef.current.height = originalImage.height;
        origCtx.drawImage(originalImage, 0, 0);
      }
    }
    
    // If we have face data, analyze the modified image
    if (faceDetection && isFaceApiLoaded) {
      setTimeout(analyzeModifiedImage, 300);
    }
  };

  const applyFeatureTransformations = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // This is a more robust transformation algorithm with expanded boundaries
    
    // Create an off-screen canvas for processing
    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx || !originalImage) return;
    
    // Draw original to off-screen canvas
    offCtx.drawImage(originalImage, 0, 0);
    const originalData = offCtx.getImageData(0, 0, width, height);
    
    // Create output image data
    const outputData = ctx.createImageData(width, height);
    
    // Approximate face center - use face detection if available, otherwise estimate
    let centerX = width / 2;
    let centerY = height / 2;
    let faceWidth = width * 0.6; // Expanded face width coverage (was 0.5)
    let faceHeight = height * 0.7; // Expanded face height coverage (was 0.6)
    
    // Use detected face box if available
    if (faceDetection && faceDetection.detection) {
      const box = faceDetection.detection.box;
      centerX = box.x + box.width / 2;
      centerY = box.y + box.height / 2;
      // Make face area 25% larger than detected to avoid edge artifacts
      faceWidth = box.width * 1.25;
      faceHeight = box.height * 1.25;
    }
    
    // Amplification factor for transformations - DRAMATICALLY INCREASED
    const amplificationFactor = 3.5;
    
    // Apply distortions based on slider values
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate normalized position relative to face center
        const normX = (x - centerX) / (faceWidth / 2);
        const normY = (y - centerY) / (faceHeight / 2);
        const distFromCenter = Math.sqrt(normX * normX + normY * normY);
        
        // Skip if outside approximate face area (expanded to 1.3 from 1.2)
        if (distFromCenter > 1.3) {
          // Just copy original pixel for areas outside the face
          const i = (y * width + x) * 4;
          outputData.data[i] = originalData.data[i];
          outputData.data[i + 1] = originalData.data[i + 1];
          outputData.data[i + 2] = originalData.data[i + 2];
          outputData.data[i + 3] = originalData.data[i + 3];
          continue;
        }
        
        // Calculate displacement based on facial feature sliders
        let displacementX = 0;
        let displacementY = 0;
        
        // Eye region - expanded region
        if (normY < -0.15 && normY > -0.65 && Math.abs(normX) > 0.1 && Math.abs(normX) < 0.45) {
          // Apply eye size transformation - amplified
          displacementX += (sliderValues.eyeSize / 50) * normX * amplificationFactor;
          displacementY += (sliderValues.eyeSize / 50) * normY * amplificationFactor;
          
          // Apply eye spacing transformation - amplified
          displacementX += (sliderValues.eyeSpacing / 50) * (normX > 0 ? 1 : -1) * amplificationFactor;
        }
        
        // Eyebrow region - just above eyes - expanded
        if (normY < -0.25 && normY > -0.75 && Math.abs(normX) > 0.05 && Math.abs(normX) < 0.5) {
          displacementY -= (sliderValues.eyebrowHeight / 50) * amplificationFactor;
        }
        
        // Nose region - expanded
        if (Math.abs(normX) < 0.25 && normY > -0.4 && normY < 0.25) {
          displacementX += (sliderValues.noseWidth / 50) * normX * amplificationFactor;
          displacementY += (sliderValues.noseLength / 50) * (normY > 0 ? 1 : -1) * amplificationFactor;
        }
        
        // Mouth region - expanded
        if (Math.abs(normX) < 0.35 && normY > 0.05 && normY < 0.45) {
          displacementX += (sliderValues.mouthWidth / 50) * normX * amplificationFactor;
          displacementY += (sliderValues.mouthHeight / 50) * (normY - 0.25) * amplificationFactor;
        }
        
        // Overall face width - expanded
        if (distFromCenter > 0.4 && distFromCenter < 1.1) {
          displacementX += (sliderValues.faceWidth / 50) * normX * amplificationFactor;
        }
        
        // Chin shape - expanded
        if (normY > 0.35 && Math.abs(normX) < 0.35) {
          displacementY += (sliderValues.chinShape / 50) * (normY - 0.4) * amplificationFactor;
        }
        
        // Jawline - expanded
        if (normY > 0.15 && Math.abs(normX) > 0.25 && Math.abs(normX) < 0.65) {
          displacementX += (sliderValues.jawline / 50) * (normX > 0 ? 1 : -1) * amplificationFactor;
        }
        
        // Calculate sample position with displacement
        const sampleX = x - displacementX;
        const sampleY = y - displacementY;
        
        // Use bilinear interpolation to sample original image
        const x1 = Math.floor(sampleX);
        const y1 = Math.floor(sampleY);
        const x2 = Math.min(x1 + 1, width - 1);
        const y2 = Math.min(y1 + 1, height - 1);
        
        const xWeight = sampleX - x1;
        const yWeight = sampleY - y1;
        
        const index = (y * width + x) * 4;
        
        // Bilinear interpolation for each color channel
        for (let c = 0; c < 3; c++) {
          const topLeft = originalData.data[(y1 * width + x1) * 4 + c];
          const topRight = originalData.data[(y1 * width + x2) * 4 + c];
          const bottomLeft = originalData.data[(y2 * width + x1) * 4 + c];
          const bottomRight = originalData.data[(y2 * width + x2) * 4 + c];
          
          const top = topLeft + (topRight - topLeft) * xWeight;
          const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight;
          let interpolated = top + (bottom - top) * yWeight;
          
          // Add amplified noise based on noise level slider
          if (sliderValues.noiseLevel > 0) {
            const noise = (Math.random() - 0.5) * sliderValues.noiseLevel * 2.5;
            interpolated += noise;
          }
          
          // Clamp values between 0-255
          outputData.data[index + c] = Math.min(255, Math.max(0, interpolated));
        }
        
        // Alpha channel stays the same
        outputData.data[index + 3] = originalData.data[(y1 * width + x1) * 4 + 3];
      }
    }
    
    // Put the processed image data onto the canvas
    ctx.putImageData(outputData, 0, 0);
  };

  const downloadImage = () => {
    if (!processedImageURL) return;
    
    const link = document.createElement("a");
    link.href = processedImageURL;
    link.download = "privacy-protected-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Image Downloaded",
      description: "Your privacy-protected image has been saved."
    });
  };

  const resetSliders = () => {
    const resetValues = featureSliders.reduce((acc, slider) => {
      acc[slider.id] = slider.defaultValue;
      return acc;
    }, {} as Record<string, number>);
    
    setSliderValues(resetValues);
    toast({
      title: "Settings Reset",
      description: "All adjustments have been reset to default values."
    });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Group sliders by category
  const slidersByCategory = featureSliders.reduce((acc, slider) => {
    if (!acc[slider.category]) {
      acc[slider.category] = [];
    }
    acc[slider.category].push(slider);
    return acc;
  }, {} as Record<string, FeatureSlider[]>);

  const handleSliderChange = (id: string, value: number) => {
    setSliderValues((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-editor-dark">Facial Privacy Editor</h1>
        <p className="text-muted-foreground">
          Subtly modify facial features to help defeat facial recognition while maintaining visual similarity
        </p>
      </div>

      {/* Add the model setup component that will handle model downloads */}
      {modelsLoadingStatus === 'error' && <ModelSetup />}

      <Tabs defaultValue="upload" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
          <TabsTrigger value="upload" onClick={() => handleTabChange("upload")}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="webcam" onClick={() => handleTabChange("webcam")}>
            <Camera className="h-4 w-4 mr-2" />
            Webcam
          </TabsTrigger>
          <TabsTrigger value="edit" onClick={() => handleTabChange("edit")} disabled={!originalImage}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="flex flex-col items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-6">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={triggerFileInput}
              >
                <Upload className="h-8 w-8 mx-auto mb-4 text-editor-purple" />
                <h3 className="text-lg font-medium mb-2">Upload an Image</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Click or drag a file to upload
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*" 
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button className="mt-2 bg-editor-purple hover:bg-editor-accent">
                  Select Image
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webcam" className="flex flex-col items-center justify-center">
          <Card className="w-full max-w-3xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <video 
                  ref={videoRef}
                  className="rounded-lg border shadow-md w-full max-h-[500px] bg-black"
                  autoPlay 
                  muted
                />
                <Button 
                  className="mt-4 bg-editor-purple hover:bg-editor-accent"
                  onClick={captureFromWebcam}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - original and processed images */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center font-medium mb-2">Original</div>
                    <div className="relative border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 h-[300px]">
                      <canvas 
                        ref={originalCanvasRef} 
                        className="max-w-full max-h-full"
                      />
                      {!originalImage && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          No image loaded
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center font-medium mb-2">Modified</div>
                    <div className="relative border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 h-[300px]">
                      <canvas 
                        ref={processedCanvasRef}
                        className="max-w-full max-h-full"
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="text-white">Processing...</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center font-medium mb-2">Analysis</div>
                    <div className="relative border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 h-[300px]">
                      <canvas 
                        ref={analysisCanvasRef}
                        className="max-w-full max-h-full"
                      />
                      {!faceDetection && originalImage && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <div className="flex flex-col items-center">
                            <Circle className="h-6 w-6 animate-spin mb-2" />
                            <span>Analyzing face...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  className="bg-editor-dark hover:bg-editor-accent"
                  onClick={triggerFileInput}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Image
                </Button>
                <Button 
                  className="bg-editor-purple hover:bg-editor-accent"
                  onClick={downloadImage}
                  disabled={!processedImageURL}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            {/* Right side - adjustment sliders */}
            <Card className="h-[600px] overflow-y-auto">
              <CardContent className="p-4">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium">Adjustments</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetSliders}
                  >
                    Reset All
                  </Button>
                </div>

                {/* Render sliders by category */}
                {Object.entries(slidersByCategory).map(([category, sliders]) => (
                  <div key={category} className="mb-6">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                    <Separator className="mb-4" />
                    <div className="space-y-6">
                      {sliders.map((slider) => (
                        <div key={slider.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{slider.name}</span>
                            <span className="text-muted-foreground">{sliderValues[slider.id]}</span>
                          </div>
                          <Slider
                            id={slider.id}
                            min={slider.min}
                            max={slider.max}
                            step={slider.step}
                            value={[sliderValues[slider.id]]}
                            onValueChange={(values) => handleSliderChange(slider.id, values[0])}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacialEditor;
