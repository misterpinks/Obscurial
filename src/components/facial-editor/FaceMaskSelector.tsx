
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EyeOff, CircleSlash, Smile, Move, Scale } from 'lucide-react';
import { Label } from "@/components/ui/label";

// Mask options with their source images - optimal size 300x300px
const FACE_MASKS = [
  { id: 'mask1', name: 'Mask 1', src: '/masks/mask1.png' },
  { id: 'mask2', name: 'Mask 2', src: '/masks/mask2.png' },
  { id: 'mask3', name: 'Mask 3', src: '/masks/mask3.png' },
  { id: 'mask4', name: 'Black Bar', src: '/masks/black-bar.png' },
];

// Define the face effect types
export type FaceEffectType = 'blur' | 'pixelate' | 'mask' | 'none';

interface FaceMaskSelectorProps {
  effectType: FaceEffectType;
  setEffectType: (type: FaceEffectType) => void;
  effectIntensity: number;
  setEffectIntensity: (intensity: number) => void;
  selectedMaskId: string | null;
  setSelectedMaskId: (id: string | null) => void;
  onLoadMaskImage: (img: HTMLImageElement | null) => void;
  maskPosition: { x: number, y: number };
  setMaskPosition: (position: { x: number, y: number }) => void;
  maskScale: number;
  setMaskScale: (scale: number) => void;
}

const FaceMaskSelector: React.FC<FaceMaskSelectorProps> = ({
  effectType,
  setEffectType,
  effectIntensity,
  setEffectIntensity,
  selectedMaskId,
  setSelectedMaskId,
  onLoadMaskImage,
  maskPosition,
  setMaskPosition,
  maskScale,
  setMaskScale
}) => {
  // Load a mask image when selected
  const handleMaskSelect = (maskId: string) => {
    if (maskId === selectedMaskId) return;
    
    setSelectedMaskId(maskId);
    setEffectType('mask');
    
    // Find the selected mask
    const mask = FACE_MASKS.find(m => m.id === maskId);
    if (mask) {
      const img = new Image();
      img.onload = () => onLoadMaskImage(img);
      img.onerror = () => {
        console.error('Failed to load mask image:', mask.src);
        onLoadMaskImage(null);
      };
      img.src = mask.src;
    }
  };
  
  // Handle effect type change
  const handleEffectTypeChange = (value: string) => {
    if (value) {
      setEffectType(value as FaceEffectType);
      
      // If switching to mask and we have a selected mask, load it
      if (value === 'mask' && selectedMaskId) {
        const mask = FACE_MASKS.find(m => m.id === selectedMaskId);
        if (mask) {
          const img = new Image();
          img.onload = () => onLoadMaskImage(img);
          img.src = mask.src;
        }
      } else if (value !== 'mask') {
        // Clear mask image if not using mask effect
        onLoadMaskImage(null);
      }
    } else {
      setEffectType('none');
      onLoadMaskImage(null);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">Face Privacy Options</h3>
        
        {/* Effect Type Selection */}
        <div className="mb-4">
          <Label className="mb-2 block">Effect Type</Label>
          <ToggleGroup 
            type="single"
            value={effectType === 'none' ? '' : effectType}
            onValueChange={handleEffectTypeChange}
            className="justify-start"
          >
            <ToggleGroupItem value="blur" aria-label="Blur face">
              <EyeOff className="h-4 w-4 mr-1" />
              Blur
            </ToggleGroupItem>
            <ToggleGroupItem value="pixelate" aria-label="Pixelate face">
              <CircleSlash className="h-4 w-4 mr-1" />
              Pixelate
            </ToggleGroupItem>
            <ToggleGroupItem value="mask" aria-label="Apply mask">
              <Smile className="h-4 w-4 mr-1" />
              Mask
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {/* Intensity Slider (for blur and pixelate) */}
        {(effectType === 'blur' || effectType === 'pixelate') && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Effect Intensity</span>
              <span className="text-muted-foreground">{effectIntensity}</span>
            </div>
            <Slider
              min={0}
              max={30}
              step={1}
              value={[effectIntensity]}
              onValueChange={(values) => setEffectIntensity(values[0])}
              aria-label="Effect intensity"
            />
          </div>
        )}
        
        {/* Mask Selection */}
        {effectType === 'mask' && (
          <div className="mt-4">
            <Label className="mb-2 block">Select Mask</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FACE_MASKS.map((mask) => (
                <Button
                  key={mask.id}
                  variant={selectedMaskId === mask.id ? "default" : "outline"}
                  className={`h-24 w-full p-1 relative ${
                    selectedMaskId === mask.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleMaskSelect(mask.id)}
                >
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <div className="w-full h-12 bg-muted rounded flex items-center justify-center overflow-hidden mb-1">
                      <img 
                        src={mask.src} 
                        alt={mask.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <span className="text-xs">{mask.name}</span>
                  </div>
                </Button>
              ))}
            </div>
            
            {/* Position controls for mask */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center">
                    <Move className="h-4 w-4 mr-1" />
                    Horizontal Position
                  </span>
                  <span className="text-muted-foreground">{Math.round(maskPosition.x * 100)}%</span>
                </div>
                <Slider
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  value={[maskPosition.x]}
                  onValueChange={(values) => setMaskPosition({ ...maskPosition, x: values[0] })}
                  aria-label="Horizontal position"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center">
                    <Move className="h-4 w-4 mr-1" />
                    Vertical Position
                  </span>
                  <span className="text-muted-foreground">{Math.round(maskPosition.y * 100)}%</span>
                </div>
                <Slider
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  value={[maskPosition.y]}
                  onValueChange={(values) => setMaskPosition({ ...maskPosition, y: values[0] })}
                  aria-label="Vertical position"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center">
                    <Scale className="h-4 w-4 mr-1" />
                    Mask Size
                  </span>
                  <span className="text-muted-foreground">{Math.round(maskScale * 100)}%</span>
                </div>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={[maskScale]}
                  onValueChange={(values) => setMaskScale(values[0])}
                  aria-label="Mask size"
                />
              </div>
              
              {/* Reset position and scale button */}
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => {
                  setMaskPosition({ x: 0, y: 0 });
                  setMaskScale(1);
                }}
              >
                Reset Position & Size
              </Button>
            </div>
          </div>
        )}
        
        {/* Clear Effect Button */}
        {effectType !== 'none' && (
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => {
              setEffectType('none');
              onLoadMaskImage(null);
            }}
          >
            Clear Effects
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FaceMaskSelector;
