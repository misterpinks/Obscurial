
import { useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook for handling batch image uploads
 */
export const useBatchUpload = (addToBatch: (image: HTMLImageElement, fileName: string) => void) => {
  const { toast } = useToast();

  const handleBatchUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      
      const fileCount = files.length;
      
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const img = new Image();
          
          img.onload = () => {
            addToBatch(img, file.name);
          };
          
          img.src = event.target?.result as string;
        };
        
        reader.readAsDataURL(file);
      });
      
      toast({
        title: "Images Added to Batch",
        description: `Added ${fileCount} image${fileCount !== 1 ? 's' : ''} to batch processing.`
      });
    };
    
    input.click();
  }, [addToBatch, toast]);

  return {
    handleBatchUpload
  };
};
