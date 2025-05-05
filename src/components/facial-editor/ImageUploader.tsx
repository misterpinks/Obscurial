
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ImageUploaderProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, inputRef }) => {
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = inputRef || internalFileInputRef;

  const triggerFileInput = () => {
    // Reset the input value first to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={triggerFileInput}
        >
          <Upload className="h-8 w-8 mx-auto mb-4 text-editor-purple" />
          <h3 className="text-lg font-medium mb-2">Upload an Image</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Click or drag a file to upload
          </p>
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*" 
            className="hidden"
            onChange={onImageUpload}
          />
          <Button className="mt-2 bg-editor-purple hover:bg-editor-accent">
            Select Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUploader;
