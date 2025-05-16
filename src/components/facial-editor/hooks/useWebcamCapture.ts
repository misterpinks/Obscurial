
import { useCallback } from 'react';

interface UseWebcamCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  setOriginalImage: (img: HTMLImageElement | null) => void;
  setActiveTab: (tab: string) => void;
}

export function useWebcamCapture({
  videoRef,
  streamRef,
  setOriginalImage,
  setActiveTab
}: UseWebcamCaptureProps) {
  const captureFromWebcam = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Create a canvas to capture the video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame to the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Create an image from the canvas
        const img = new Image();
        img.onload = () => {
          // Set as original image
          setOriginalImage(img);
          // Switch to edit tab
          setActiveTab('edit');
        };
        img.src = canvas.toDataURL('image/png');
        return img;
      }
    }
    return null;
  }, [videoRef, setOriginalImage, setActiveTab]);

  return {
    captureFromWebcam
  };
}
