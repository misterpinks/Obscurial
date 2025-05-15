
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, RotateCcw, RotateCw } from "lucide-react";

interface FaceMirrorControlsProps {
  mirrorEnabled: boolean;
  mirrorSide: number;
  mirrorOffsetX?: number;
  mirrorAngle?: number;
  mirrorCutoffY?: number;
  onToggleMirror: () => void;
  onToggleSide: () => void;
  onOffsetChange?: (value: number) => void;
  onOffsetChangeComplete?: () => void;
  onAngleChange?: (value: number) => void;
  onAngleChangeComplete?: () => void;
  onCutoffChange?: (value: number) => void;
  onCutoffChangeComplete?: () => void;
}

const FaceMirrorControls: React.FC<FaceMirrorControlsProps> = ({
  mirrorEnabled,
  mirrorSide,
  mirrorOffsetX = 0,
  mirrorAngle = 0,
  mirrorCutoffY = 1,
  onToggleMirror,
  onToggleSide,
  onOffsetChange,
  onOffsetChangeComplete,
  onAngleChange,
  onAngleChangeComplete,
  onCutoffChange,
  onCutoffChangeComplete
}) => {
  const sideText = mirrorSide === 0 ? 'Left → Right' : 'Right → Left';
  
  return (
    <Card className="mb-4">
      <CardContent className="pt-4 pb-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch 
                checked={mirrorEnabled} 
                onCheckedChange={onToggleMirror}
              />
              <Label htmlFor="mirror-face" className="font-medium">Face Mirroring</Label>
            </div>
            {mirrorEnabled && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onToggleSide}
                className="h-8 px-3 text-xs"
              >
                {mirrorSide === 0 ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                <span className="ml-1">{sideText}</span>
              </Button>
            )}
          </div>
          
          {mirrorEnabled && (
            <>
              <Separator />
              
              {/* Offset control */}
              {onOffsetChange && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mirror Position</span>
                    <span className="text-muted-foreground">{Math.round(mirrorOffsetX * 100)}%</span>
                  </div>
                  <Slider
                    value={[mirrorOffsetX * 100]}
                    min={-100}
                    max={100}
                    step={1}
                    onValueChange={(values) => onOffsetChange(values[0] / 100)}
                    onValueCommit={onOffsetChangeComplete}
                    className="mt-1"
                  />
                </div>
              )}
              
              {/* Angle control */}
              {onAngleChange && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mirror Angle</span>
                    <div className="flex items-center text-muted-foreground">
                      {mirrorAngle < 0 ? <RotateCcw size={12} className="mr-1" /> : <RotateCw size={12} className="mr-1" />}
                      {Math.abs(Math.round(mirrorAngle))}°
                    </div>
                  </div>
                  <Slider
                    value={[mirrorAngle]}
                    min={-45}
                    max={45}
                    step={1}
                    onValueChange={(values) => onAngleChange(values[0])}
                    onValueCommit={onAngleChangeComplete}
                    className="mt-1"
                  />
                </div>
              )}
              
              {/* Cutoff control */}
              {onCutoffChange && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cutoff Point</span>
                    <span className="text-muted-foreground">{Math.round(mirrorCutoffY * 100)}%</span>
                  </div>
                  <Slider
                    value={[mirrorCutoffY * 100]}
                    min={50}
                    max={100}
                    step={1}
                    onValueChange={(values) => onCutoffChange(values[0] / 100)}
                    onValueCommit={onCutoffChangeComplete}
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceMirrorControls;
