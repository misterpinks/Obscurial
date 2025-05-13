
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface FaceMirrorControlsProps {
  mirrorEnabled: boolean;
  mirrorSide: number;
  onToggleMirror: () => void;
  onToggleSide: () => void;
}

const FaceMirrorControls: React.FC<FaceMirrorControlsProps> = ({
  mirrorEnabled,
  mirrorSide,
  onToggleMirror,
  onToggleSide
}) => {
  const { toast } = useToast();
  
  const handleToggleMirror = () => {
    onToggleMirror();
    toast({
      title: mirrorEnabled ? "Symmetry Disabled" : "Symmetry Enabled",
      description: mirrorEnabled 
        ? "Face symmetry has been turned off." 
        : "Face symmetry is now enabled."
    });
  };
  
  const handleToggleSide = () => {
    if (!mirrorEnabled) {
      onToggleMirror(); // Enable mirroring if it's not on
    }
    onToggleSide();
    toast({
      description: `Mirroring ${mirrorSide === 0 ? "right side from left" : "left side from right"}`
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Face Symmetry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Enable Face Symmetry</h4>
              <p className="text-xs text-muted-foreground">
                Create perfect symmetry by mirroring one side
              </p>
            </div>
            <Switch 
              checked={mirrorEnabled} 
              onCheckedChange={handleToggleMirror}
              className="data-[state=checked]:bg-editor-purple"
            />
          </div>
          <Separator />
          <div className="flex flex-col space-y-2">
            <h4 className="text-sm font-medium mb-2">Mirror Direction</h4>
            <ToggleGroup type="single" value={mirrorSide.toString()} onValueChange={(value) => {
              if (value) {
                if (!mirrorEnabled) onToggleMirror();
                if (value !== mirrorSide.toString()) onToggleSide();
              }
            }}>
              <ToggleGroupItem value="0" className={mirrorSide === 0 ? "bg-editor-purple text-white" : ""}>
                Left → Right
              </ToggleGroupItem>
              <ToggleGroupItem value="1" className={mirrorSide === 1 ? "bg-editor-purple text-white" : ""}>
                Right → Left
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground pt-2">
              {mirrorSide === 0 
                ? "Copying left side of face to right side" 
                : "Copying right side of face to left side"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceMirrorControls;
