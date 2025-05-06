
import { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface UseFileUploadProps {
  setOriginalImage: (img: HTMLImageElement | null) => void;
  setActiveTab: (tab: string) => void;
  setFaceDetection: (detection: any) => void;
  setInitialProcessingDone: (done: boolean) => void;
  setHasShownNoFaceToast: (shown: boolean) => void;
}

export const useFileUpload = ({
  setOriginalImage,
  setActiveTab,
  setFaceDetection,
  setInitialProcessingDone,
  setHasShownNoFaceToast
}: UseFileUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearCanvases = () => {
    // Find all canvas elements and clear them
    // This ensures we don't have stale image data persisting
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        console.log("Clearing canvas:", canvas.id || "unnamed canvas");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
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
    
    console.log("Loading new image file:", file.name);
    
    // First set all states to null/false to ensure clean slate
    setOriginalImage(null);
    setFaceDetection(null);
    setInitialProcessingDone(false);
    setHasShownNoFaceToast(false);
    
    // Clear canvases before loading new image to prevent stale data
    clearCanvases();
    
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log("File loaded into memory, creating image object");
      const img = new Image();
      img.onload = () => {
        console.log("Image loaded, dimensions:", img.width, "x", img.height);
        
        // Clear canvases once more before setting the image
        clearCanvases();
        
        // After the image is loaded, set the states
        setOriginalImage(img);
        
        // After a short delay, force initialize processing - this ensures the image is shown
        setTimeout(() => {
          setInitialProcessingDone(true);
        }, 300);
        
        setActiveTab("edit");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    // Reset the input value first to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return {
    fileInputRef,
    handleImageUpload,
    triggerFileInput,
    clearCanvases
  };
};
