
import { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useEditorState = () => {
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const cleanProcessedCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle showing notifications
  const showToast = (title: string, description: string, variant?: 'default' | 'destructive') => {
    toast({
      title,
      description,
      variant
    });
  };

  return {
    // Canvas and video refs
    originalCanvasRef,
    processedCanvasRef,
    cleanProcessedCanvasRef,
    videoRef,
    streamRef,
    
    // Image state
    originalImage,
    setOriginalImage,
    
    // Toast handler
    showToast
  };
};
