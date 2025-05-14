
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FaceMirrorControlsProps {
  mirrorEnabled?: boolean;
  mirrorSide?: number;
  onToggleMirror: () => void;
  onToggleSide: () => void;
}

const FaceMirrorControls: React.FC<FaceMirrorControlsProps> = ({
  mirrorEnabled = false,
  mirrorSide = 0,
  onToggleMirror,
  onToggleSide
}) => {
  return (
    <div className="space-y-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
      <div className="flex items-center justify-between">
        <Label htmlFor="mirror-toggle" className="cursor-pointer">Mirror Face</Label>
        <Switch 
          id="mirror-toggle" 
          checked={mirrorEnabled} 
          onCheckedChange={onToggleMirror} 
        />
      </div>
      
      {mirrorEnabled && (
        <div className="flex items-center justify-between">
          <Label htmlFor="mirror-side" className="cursor-pointer">
            Mirror Side: {mirrorSide === 0 ? "Left" : "Right"}
          </Label>
          <Switch 
            id="mirror-side" 
            checked={mirrorSide !== 0} 
            onCheckedChange={onToggleSide} 
          />
        </div>
      )}
    </div>
  );
};

export default FaceMirrorControls;
