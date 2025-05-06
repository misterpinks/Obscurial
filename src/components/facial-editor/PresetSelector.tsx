
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, Sparkles } from "lucide-react";
import { Preset } from './hooks/usePresets';

interface PresetSelectorProps {
  presets: Preset[];
  onApplyPreset: (presetId: string) => void;
  onSavePreset: (name: string, description?: string) => void;
  onDeletePreset?: (presetId: string) => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim(), presetDescription.trim() || undefined);
      setIsDialogOpen(false);
      setPresetName('');
      setPresetDescription('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Presets</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Save Current
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {presets.map(preset => (
          <Card 
            key={preset.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onApplyPreset(preset.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  {preset.description && (
                    <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog for saving new preset */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Settings as Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="preset-name" className="text-sm font-medium">
                Preset Name
              </label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Enter a name for this preset"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="preset-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="preset-description"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Briefly describe this preset"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresetSelector;
