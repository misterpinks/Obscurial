
import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";

interface EditorImageControlsProps {
  triggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadImage: () => void;
  hasProcessedImage: boolean;
}

const EditorImageControls: React.FC<EditorImageControlsProps> = ({
  triggerFileInput,
  fileInputRef,
  handleImageUpload,
  downloadImage,
  hasProcessedImage
}) => {
  return (
    <div className="flex justify-center space-x-4">
      <Button 
        className="bg-editor-dark hover:bg-editor-accent"
        onClick={triggerFileInput}
      >
        <Upload className="h-4 w-4 mr-2" />
        Change Image
      </Button>
      <input 
        type="file" 
        ref={fileInputRef}
        accept="image/*" 
        className="hidden"
        onChange={handleImageUpload}
      />
      <Button 
        className="bg-editor-purple hover:bg-editor-accent"
        onClick={downloadImage}
        disabled={!hasProcessedImage}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  );
};

export default EditorImageControls;
