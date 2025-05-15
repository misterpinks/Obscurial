
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { type FeatureSlider } from './useFeatureSliders';

export interface Preset {
  id: string;
  name: string;
  values: Record<string, number>;
  description?: string;
}

interface UsePresetsOptions {
  featureSliders: FeatureSlider[];
  sliderValues: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
}

export const usePresets = ({ featureSliders, sliderValues, onChange }: UsePresetsOptions) => {
  const { toast } = useToast();
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const savedPresets = localStorage.getItem('facialEditorPresets');
      return savedPresets ? JSON.parse(savedPresets) : [];
    } catch (e) {
      console.error('Error loading presets:', e);
      return [];
    }
  });

  // Save presets to local storage whenever they change
  const savePresetsToStorage = useCallback((updatedPresets: Preset[]) => {
    try {
      localStorage.setItem('facialEditorPresets', JSON.stringify(updatedPresets));
    } catch (e) {
      console.error('Error saving presets:', e);
    }
  }, []);

  // Apply a preset to the current sliders
  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onChange(preset.values);
      
      toast({
        title: "Preset Applied",
        description: `Applied preset: ${preset.name}`
      });
    }
  }, [presets, onChange, toast]);

  // Save current slider values as a new preset
  const saveCurrentAsPreset = useCallback((name: string, description?: string) => {
    if (!name) return;
    
    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      values: { ...sliderValues },
      description
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
    
    toast({
      title: "Preset Saved",
      description: `Saved preset: ${name}`
    });
  }, [sliderValues, presets, savePresetsToStorage, toast]);

  // Delete a preset
  const deletePreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      setPresets(updatedPresets);
      savePresetsToStorage(updatedPresets);
      
      toast({
        title: "Preset Deleted",
        description: `Deleted preset: ${preset.name}`
      });
    }
  }, [presets, savePresetsToStorage, toast]);

  return {
    presets,
    applyPreset,
    saveCurrentAsPreset,
    deletePreset
  };
};
