
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Layers } from "lucide-react";
import { generateVectorFieldVisualization } from './utils/transformation/transformCore';

interface VectorFieldVisualizationProps {
  originalImage: HTMLImageElement | null;
  faceDetection: any;
  sliderValues: Record<string, number>;
  imageDimensions: { width: number; height: number } | null;
}

const VectorFieldVisualization: React.FC<VectorFieldVisualizationProps> = ({ 
  originalImage,
  faceDetection,
  sliderValues,
  imageDimensions
}) => {
  const vectorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generate vector field visualization whenever sliders or face detection changes
  useEffect(() => {
    if (!vectorCanvasRef.current || !originalImage || !imageDimensions) return;
    
    const generateVisualization = () => {
      try {
        setIsGenerating(true);
        const canvas = vectorCanvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set canvas dimensions
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        
        // Get amplification factor from facialRegions
        const { getAmplificationFactor } = require('./utils/facialRegions');
        const amplificationFactor = getAmplificationFactor();
        
        // Approximate face center and dimensions
        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;
        let faceWidth = canvas.width * 0.8;
        let faceHeight = canvas.height * 0.9;
        
        // Use detected face box if available
        if (faceDetection && faceDetection.detection && faceDetection.detection.box) {
          const box = faceDetection.detection.box;
          centerX = box.x + box.width / 2;
          centerY = box.y + box.height / 2;
          faceWidth = box.width * 3.0;
          faceHeight = box.height * 3.0;
        }
        
        // Generate vector field visualization
        const vectorField = generateVectorFieldVisualization(
          canvas.width,
          canvas.height,
          centerX,
          centerY,
          faceWidth / 2,
          faceHeight / 2,
          sliderValues,
          amplificationFactor
        );
        
        // Draw the vector field on top of a semi-transparent copy of the original
        ctx.globalAlpha = 0.3;
        ctx.drawImage(originalImage, 0, 0);
        ctx.globalAlpha = 1.0;
        ctx.putImageData(vectorField, 0, 0);
        
        // Draw face outline if detection exists
        if (faceDetection && faceDetection.detection && faceDetection.detection.box) {
          const box = faceDetection.detection.box;
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
      } catch (error) {
        console.error("Error generating vector field visualization:", error);
      } finally {
        setIsGenerating(false);
      }
    };
    
    const timer = setTimeout(generateVisualization, 100);
    return () => clearTimeout(timer);
  }, [originalImage, faceDetection, sliderValues, imageDimensions]);
  
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-editor-accent" />
            <h3 className="text-lg font-medium">Displacement Vector Field</h3>
          </div>
          {isGenerating && (
            <div className="text-xs text-muted-foreground animate-pulse">Generating...</div>
          )}
        </div>
        
        <div className="relative border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 h-[300px]">
          <canvas 
            ref={vectorCanvasRef} 
            className="max-w-full max-h-full"
          />
          {!originalImage && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              No image loaded
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Algorithm Details</h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Transformation Method:</span> Circular/elliptical region warping with overlapping boundaries
            </p>
            <p>
              <span className="font-medium text-foreground">Interpolation:</span> Advanced bi-cubic with 7th-degree polynomial transition blending
            </p>
            <p>
              <span className="font-medium text-foreground">Amplification Factor:</span> {getAmplificationFactor ? getAmplificationFactor() : "7.0"}x
            </p>
            <p>
              <span className="font-medium text-foreground">Color Coding:</span> Vector direction (hue) and magnitude (brightness)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to safely get the amplification factor
function getAmplificationFactor(): number {
  try {
    const { getAmplificationFactor } = require('./utils/facialRegions');
    return getAmplificationFactor();
  } catch (e) {
    return 7.0; // Default fallback
  }
}

export default VectorFieldVisualization;
