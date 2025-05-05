
import React, { useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WebcamCaptureProps {
  onCapture: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  streamRef: React.MutableRefObject<MediaStream | null>;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ 
  onCapture, 
  videoRef, 
  streamRef 
}) => {
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startWebcam();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <video 
            ref={videoRef}
            className="rounded-lg border shadow-md w-full max-h-[500px] bg-black"
            autoPlay 
            muted
          />
          <Button 
            className="mt-4 bg-editor-purple hover:bg-editor-accent"
            onClick={onCapture}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebcamCapture;
