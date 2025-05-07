
import React, { useState } from 'react';
import { AlertCircle, Upload } from 'lucide-react';

interface FileLoaderProps {
  onImageLoad: (imageData: {
    src: string;
    width: number;
    height: number;
    name: string;
    type: string;
    size: number;
  }) => void;
  className?: string;
}

const FileLoader: React.FC<FileLoaderProps> = ({ onImageLoad, className = '' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle file selection
  const handleFile = (file: File) => {
    // Reset states
    setError(null);
    setLoading(true);
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      setLoading(false);
      return;
    }
    
    // Create a FileReader to read the image
    const reader = new FileReader();
    
    reader.onload = (e) => {
      // Create an image to check dimensions
      const img = new Image();
      
      img.onload = () => {
        // File successfully loaded
        setLoading(false);
        
        // Check if dimensions are reasonable (optional validation)
        if (img.width < 10 || img.height < 10) {
          setError('Image dimensions are too small');
          return;
        }
        
        // Notify parent component
        onImageLoad({
          src: e.target?.result as string,
          width: img.width,
          height: img.height,
          name: file.name,
          type: file.type,
          size: file.size
        });
        
        // Debug log
        console.log('Image loaded successfully:', {
          name: file.name,
          type: file.type,
          size: `${Math.round(file.size / 1024)} KB`,
          dimensions: `${img.width}x${img.height}`
        });
      };
      
      img.onerror = () => {
        setLoading(false);
        setError('Failed to process image');
      };
      
      // Set source to validate the image
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      setLoading(false);
      setError('Failed to read file');
    };
    
    // Start reading the file
    reader.readAsDataURL(file);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };
  
  return (
    <div 
      className={`file-loader rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors bg-white bg-opacity-95 shadow-md ${
        dragActive ? 'bg-gray-100' : ''
      } ${className}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <label 
        htmlFor="file-input"
        className="file-input-label cursor-pointer block"
      >
        {loading ? (
          <div className="loading-text flex justify-center items-center flex-col">
            <div className="animate-spin h-8 w-8 border-4 border-gray-400 border-t-blue-600 rounded-full mb-2"></div>
            <p>Loading image...</p>
          </div>
        ) : (
          <div className="upload-text">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-base font-medium">Drag & drop an image here or click to select</p>
            <p className="text-xs text-gray-500 mt-1">
              Supports: JPEG, PNG, WebP, GIF
            </p>
          </div>
        )}
      </label>
      
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      
      {error && (
        <div className="error-message flex items-center justify-center mt-3 text-red-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileLoader;
