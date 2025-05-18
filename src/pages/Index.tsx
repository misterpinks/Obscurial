
import FacialEditor from "@/components/facial-editor/FacialEditor";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { useToast } from '@/components/ui/use-toast';
import { FaceDetectionProvider } from "@/components/facial-editor/context/FaceDetectionContext";
import * as faceapi from 'face-api.js';
import { loadModelsFromGitHub } from '@/utils/downloadModels';

const Index = () => {
  const [bgImagePath, setBgImagePath] = useState<string>('./Background.png');
  const [isFaceApiLoaded, setIsFaceApiLoaded] = useState(false);
  const [modelsLoadingStatus, setModelsLoadingStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { toast } = useToast();
  
  // Load face-api.js models
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
  }, [toast]);
  
  // Handle different environments for background image
  useEffect(() => {
    // For Electron, use the resources path
    if ((window as any).electron) {
      setBgImagePath((window as any).electron.getResourcePath('ui/Background.png') || './Background.png');
    } else {
      // For web, use the public path instead of src path
      setBgImagePath('./Background.png');
    }
  }, []);
  
  return (
    <div className="min-h-screen relative bg-gray-50">
      {/* Background image with fade effect */}
      <div 
        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center" 
        style={{ backgroundImage: `url('${bgImagePath}')` }}
      />
      
      {/* Content container with relative positioning to appear above the background */}
      <div className="relative z-10">
        <FaceDetectionProvider 
          isFaceApiLoaded={isFaceApiLoaded} 
          toast={toast}
        >
          <FacialEditor 
            isFaceApiLoaded={isFaceApiLoaded}
            modelsLoadingStatus={modelsLoadingStatus}
          />
        </FaceDetectionProvider>
      </div>
      
      {/* Add Toaster for notifications */}
      <Toaster />
    </div>
  );
};

export default Index;
