
import React, { useState, useEffect, useRef } from 'react';

interface ImageDisplayProps {
  imageSource?: string;
  filters?: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    hue: number;
    sepia: number;
  };
  className?: string;
  onImageLoaded?: () => void;
}

const ImageDisplay = ({ 
  imageSource,
  filters = {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    blur: 0,
    hue: 0,
    sepia: 0
  }, 
  className = '',
  onImageLoaded
}: ImageDisplayProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Load image and draw it to canvas
  useEffect(() => {
    if (!imageSource) {
      console.log('No image source provided');
      return;
    }
    
    console.log('Loading image from source:', imageSource);
    
    // Create a new image
    const img = new Image();
    imageRef.current = img;
    
    // Handle successful load
    img.onload = () => {
      console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
      setImageLoaded(true);
      setImageError(false);
      renderImage();
      if (onImageLoaded) onImageLoaded();
    };
    
    // Handle error
    img.onerror = (error) => {
      console.error('Failed to load image:', imageSource, error);
      setImageError(true);
      setImageLoaded(false);
    };
    
    // Set source to trigger loading
    img.src = imageSource;
    
    return () => {
      // Cleanup
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSource, onImageLoaded]);
  
  // Re-render when filters change
  useEffect(() => {
    if (imageLoaded) {
      console.log('Filters changed, re-rendering image');
      renderImage();
    }
  }, [filters, imageLoaded]);
  
  // Render image with filters to canvas
  const renderImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) {
      console.log('Canvas or image reference not available');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    // Set canvas dimensions to match image while considering device pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;
    canvas.style.width = `${imageRef.current.width / pixelRatio}px`;
    canvas.style.height = `${imageRef.current.height / pixelRatio}px`;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply CSS filters for performance
    ctx.filter = `
      brightness(${filters.brightness})
      contrast(${filters.contrast})
      saturate(${filters.saturation})
      blur(${filters.blur}px)
      hue-rotate(${filters.hue}deg)
      sepia(${filters.sepia})
    `;
    
    // Draw image
    console.log('Drawing image to canvas with filters');
    ctx.drawImage(imageRef.current, 0, 0);
    
    // Reset filter
    ctx.filter = 'none';
  };
  
  return (
    <div className={`image-display ${className}`}>
      {!imageLoaded && !imageError && (
        <div className="flex items-center justify-center p-4 text-sm text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-blue-500 rounded-full mr-2"></div>
          Loading image...
        </div>
      )}
      
      {imageError && (
        <div className="flex items-center justify-center p-4 text-sm text-red-500">
          Failed to load image. Please check the file path.
        </div>
      )}
      
      <canvas 
        ref={canvasRef}
        className={`image-canvas ${imageLoaded ? 'visible' : 'hidden'}`}
        style={{
          display: imageLoaded ? 'block' : 'none',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};

export default ImageDisplay;
