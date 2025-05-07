
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
    
    // Ensure any Canvas references are reset
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    
    // Use a slightly longer timeout to ensure the UI updates before loading the new image
    setTimeout(() => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        
        // Generate unique URL to force browser to treat as new image
        const uniqueUrl = dataUrl + (dataUrl.includes('?') ? '&' : '?') + 'ts=' + new Date().getTime();
        
        // Store current URL for future comparison
        currentImageUrlRef.current = uniqueUrl;
        
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Handle CORS if needed
        
        img.onload = () => {
          console.log("New image loaded:", img.width, "x", img.height);
          
          // Only set the image if this is still the current operation
          if (currentImageUrlRef.current === uniqueUrl) {
            setOriginalImage(img);
            setActiveTab("edit");
          }
        };
        
        // Set the source to start loading the image
        img.src = uniqueUrl;
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
    }, 300); // Increased timeout for better UI updating
    
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
