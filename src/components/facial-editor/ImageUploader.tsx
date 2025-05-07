import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import FileLoader from './FileLoader';
import { Card, CardContent } from "@/components/ui/card";

interface ImageUploaderProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  triggerFileInput: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  inputRef,
  triggerFileInput
}) => {
  // Handler for FileLoader component
  const handleImageLoad = (imageData: {
    src: string;
    width: number;
    height: number;
    name: string;
    type: string;
    size: number;
  }) => {
    // Create a new Image element to pass to the existing handler
    const img = new Image();
    img.src = imageData.src;
    img.onload = () => {
      // Create a synthetic event with the file
      if (inputRef.current) {
        // Create a file from the image data
        fetch(imageData.src)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], imageData.name, { type: imageData.type });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            
            if (inputRef.current) {
              inputRef.current.files = dataTransfer.files;
              
              // Trigger change event
              const event = new Event('change', { bubbles: true });
              inputRef.current.dispatchEvent(event);
              
              // Call the original handler
              if (onImageUpload) {
                onImageUpload({ target: { files: dataTransfer.files } } as any);
              }
            }
          });
      }
    };
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardContent className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Upload Your Image</h2>
          <p className="text-muted-foreground mb-8">
            Upload an image to start editing. We'll protect your privacy by making your face unrecognizable to AI systems.
          </p>
        </div>

        {/* New FileLoader component */}
        <FileLoader onImageLoad={handleImageLoad} className="mb-6" />
        
        {/* Keep the original file input for compatibility */}
        <input 
          type="file" 
          ref={inputRef}
          onChange={onImageUpload}
          accept="image/*"
          className="hidden"
        />

        <div className="text-center">
          <Button 
            onClick={triggerFileInput}
            variant="outline"
            className="mt-4"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select a different file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUploader;
