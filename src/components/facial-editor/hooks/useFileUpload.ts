
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
    
    // Reset states when loading a new image
    setFaceDetection(null);
    setInitialProcessingDone(false);
    setHasShownNoFaceToast(false);
    
    // Force image refresh by setting to null first
    setOriginalImage(null);
    
    // Use timeout to ensure the UI updates before loading the new image
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          console.log("New image loaded:", img.width, "x", img.height);
          setOriginalImage(img);
          setActiveTab("edit");
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }, 100);
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
