
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface Preset {
  id: string;
  name: string;
  values: Record<string, number>;
  description?: string;
}

export const usePresets = (
  featureSliders: any[], 
  sliderValues: Record<string, number>,
  setSliderValues: (values: Record<string, number>) => void
) => {
  const { toast } = useToast();
  const [presets, setPresets] = useState<Preset[]>([
    {
      id: 'privacy-basic',
      name: 'Basic Privacy',
      values: {
        eyeSize: 10,
        eyeSpacing: 5,
        eyebrowHeight: 10,
        noseWidth: 15,
        noseLength: 5,
        mouthWidth: 10,
        mouthHeight: 5,
        faceWidth: 15,
        chinShape: 10,
        jawline: 8,
      },
      description: 'Subtle changes that help defeat facial recognition'
    },
    {
      id: 'privacy-strong',
      name: 'Strong Privacy',
      values: {
        eyeSize: 25,
        eyeSpacing: 20,
        eyebrowHeight: 30,
        noseWidth: 30,
        noseLength: 20,
        mouthWidth: 25,
        mouthHeight: 15,
        faceWidth: 30,
        chinShape: 25,
        jawline: 20,
      },
      description: 'Stronger changes to maximize privacy'
    },
    {
      id: 'alien',
      name: 'Alien Look',
      values: {
        eyeSize: 40,
        eyeSpacing: 30,
        eyebrowHeight: -30,
        noseWidth: -35,
        noseLength: -40,
        mouthWidth: -15,
        mouthHeight: -30,
        faceWidth: -45,
        chinShape: 50,
        jawline: -40,
      },
      description: 'Create an alien-like appearance'
    },
    {
      id: 'cartoon',
      name: 'Cartoon Style',
      values: {
        eyeSize: 35,
        eyeSpacing: -10,
        eyebrowHeight: 20,
        noseWidth: -25,
        noseLength: -15,
        mouthWidth: 35,
        mouthHeight: 20,
        faceWidth: 10,
        chinShape: -20,
        jawline: 15,
      },
      description: 'Cartoon-inspired facial features'
    },
  ]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    
    if (preset) {
      // Create new sliders object with preset values
      const newSliderValues = { ...sliderValues };
      
      // Apply preset values to each slider
      Object.keys(preset.values).forEach(key => {
        if (key in newSliderValues) {
          newSliderValues[key] = preset.values[key];
        }
      });
      
      // Update slider values
      setSliderValues(newSliderValues);
      
      toast({
        title: `Applied "${preset.name}" preset`,
        description: preset.description || "Preset applied successfully"
      });
    }
  }, [presets, sliderValues, setSliderValues, toast]);

  const saveCurrentAsPreset = useCallback((name: string, description?: string) => {
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name,
      values: { ...sliderValues },
      description
    };
    
    setPresets(prev => [...prev, newPreset]);
    
    toast({
      title: "Preset Saved",
      description: `"${name}" has been added to your presets`
    });
    
    return newPreset;
  }, [sliderValues, toast]);

  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
    
    toast({
      title: "Preset Deleted",
      description: "The preset has been removed"
    });
  }, [toast]);

  return { presets, applyPreset, saveCurrentAsPreset, deletePreset };
};
