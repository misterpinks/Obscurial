
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseImageDownloadProps {
  cleanProcessedImageURL: string;
}

export const useImageDownload = ({ 
  cleanProcessedImageURL 
}: UseImageDownloadProps) => {
  const { toast } = useToast();

  const downloadImage = useCallback(() => {
    if (!cleanProcessedImageURL) return;
    
    const link = document.createElement("a");
    link.href = cleanProcessedImageURL;
    link.download = "privacy-protected-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Image Downloaded",
      description: "Your privacy-protected image has been saved."
    });
  }, [cleanProcessedImageURL, toast]);

  return { downloadImage };
};
