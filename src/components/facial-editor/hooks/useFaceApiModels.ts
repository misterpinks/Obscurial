
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { loadModelsFromGitHub } from '@/utils/downloadModels';

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
  }, [toast]);

  return { isFaceApiLoaded, modelsLoadingStatus };
};
