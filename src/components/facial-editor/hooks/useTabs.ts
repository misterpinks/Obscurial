
import { useState, RefObject } from 'react';

interface UseTabsProps {
  videoRef: RefObject<HTMLVideoElement>;
  streamRef: RefObject<MediaStream | null>;
  originalImage: HTMLImageElement | null;
  setFaceDetection: (detection: any) => void;
  setInitialProcessingDone: (done: boolean) => void;
  setHasShownNoFaceToast: (shown: boolean) => void;
}

export const useTabs = ({
  videoRef,
  streamRef,
  originalImage,
  setFaceDetection,
  setInitialProcessingDone,
  setHasShownNoFaceToast
}: UseTabsProps) => {
  const [activeTab, setActiveTab] = useState("upload");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Stop webcam if switching away from webcam tab
    if (value !== "webcam" && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        // We need to use a mutable variable to avoid trying to modify read-only property
        const videoElement = videoRef.current;
        videoElement.srcObject = null;
      }
    }
  };

  const captureFromWebcam = () => {
    if (!videoRef.current || !streamRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const img = new Image();
      img.onload = () => {
        setActiveTab("edit");
        
        // Reset detection states when capturing a new image
        setFaceDetection(null);
        setInitialProcessingDone(false);
        setHasShownNoFaceToast(false);
      };
      img.src = canvas.toDataURL("image/png");
      return img;
    }
    return null;
  };

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
    captureFromWebcam
  };
};
