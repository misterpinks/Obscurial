
import { useRef, useCallback } from 'react';
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
  
  // Track current image URL for proper refreshing
  const currentImageUrlRef = useRef<string | null>(null);

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
    
    console.log("Image upload started:", file.name);
    
    // Reset states completely before loading new image
    setFaceDetection(null);
    setInitialProcessingDone(false);
    setHasShownNoFaceToast(false);
    
    // Force complete image refresh by setting to null first
    setOriginalImage(null);
    
    // Create a FileReader
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target || typeof event.target.result !== 'string') {
        console.error("Failed to read file");
        toast({
          variant: "destructive",
          title: "Error Loading Image",
          description: "Failed to read the selected image file."
        });
        return;
      }
      
      const dataUrl = event.target.result;
      
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Handle CORS if needed
      
      img.onload = () => {
        console.log("New image loaded:", img.width, "x", img.height);
        setOriginalImage(img);
        setActiveTab("edit");
      };
      
      img.onerror = () => {
        console.error("Failed to load image");
        toast({
          variant: "destructive",
          title: "Image Load Failed",
          description: "Could not load the selected image file."
        });
      };
      
      // Set the source to start loading the image
      img.src = dataUrl;
    };
    
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      toast({
        variant: "destructive",
        title: "Error Loading Image",
        description: "Failed to read the selected image file."
      });
    };
    
    // Start reading the file as data URL
    reader.readAsDataURL(file);
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
  }, [setOriginalImage, setActiveTab, setFaceDetection, setInitialProcessingDone, setHasShownNoFaceToast, toast]);

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
    triggerFileInput
  };
};
