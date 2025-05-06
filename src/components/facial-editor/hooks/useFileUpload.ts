
import { useState, useRef, useCallback } from 'react';
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

  const clearCanvases = useCallback(() => {
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
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Reset all state to ensure a clean slate
    setOriginalImage(null);
    setFaceDetection(null);
    setInitialProcessingDone(false);
    setHasShownNoFaceToast(false);
    
    // Clear canvases before loading new image
    clearCanvases();
    
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log("File loaded into memory, creating image object");
      
      const img = new Image();
      img.onload = () => {
        console.log("Image loaded successfully, dimensions:", img.width, "x", img.height);
        
        // Clear canvases again to be safe
        clearCanvases();
        
        // Set the image in state
        setOriginalImage(img);
        
        // After a short delay, trigger initial processing
        // This ensures the image is rendered before face detection starts
        setTimeout(() => {
          console.log("Setting initialProcessingDone to true to trigger processing");
          setInitialProcessingDone(true);
        }, 100);
        
        // Switch to edit tab
        setActiveTab("edit");
      };
      
      // Handle image loading errors
      img.onerror = (error) => {
        console.error("Failed to load image:", error);
        toast({
          variant: "destructive",
          title: "Image Loading Failed",
          description: "Could not load the selected image."
        });
      };
      
      // Set the image source from the file reader result
      img.src = event.target?.result as string;
    };
    
    // Handle file reading errors
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "File Reading Error",
        description: "Failed to read the selected file."
      });
    };
    
    // Start reading the file
    reader.readAsDataURL(file);
  }, [toast, setOriginalImage, setFaceDetection, setInitialProcessingDone, setHasShownNoFaceToast, clearCanvases, setActiveTab]);

  const triggerFileInput = useCallback(() => {
    // Reset the input value first to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  return {
    fileInputRef,
    handleImageUpload,
    triggerFileInput,
    clearCanvases
  };
};
