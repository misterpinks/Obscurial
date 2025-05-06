
import React, { RefObject } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

export interface ImageUploaderProps {
  inputRef: RefObject<HTMLInputElement>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ inputRef, onImageUpload, triggerFileInput }) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={triggerFileInput}
        >
          <Upload className="h-8 w-8 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium mb-2">Upload an Image</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Click or drag a file to upload
          </p>
          <input 
            type="file" 
            ref={inputRef}
            accept="image/*" 
            className="hidden"
            onChange={onImageUpload}
          />
          <Button className="mt-2">
            Select Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUploader;
