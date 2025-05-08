
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface UseImageDownloadProps {
  cleanProcessedImageURL: string;
  hasProcessedImage: boolean;
}

export const useImageDownload = ({ cleanProcessedImageURL, hasProcessedImage }: UseImageDownloadProps) => {
  const { toast } = useToast();

  const downloadImage = useCallback(() => {
    if (!cleanProcessedImageURL || !hasProcessedImage) {
      toast({
        title: "No processed image",
        description: "Please process an image before downloading.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Downloading image from URL:", cleanProcessedImageURL.substring(0, 30) + "...");
    
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
  }, [cleanProcessedImageURL, hasProcessedImage, toast]);

  return { downloadImage };
};
