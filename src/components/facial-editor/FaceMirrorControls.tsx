
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

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
            <h4 className="text-sm font-medium">Mirror Direction</h4>
            <div className="flex space-x-2">
              <Button
                variant={mirrorSide === 0 ? "default" : "outline"}
                className={mirrorSide === 0 ? "bg-editor-purple" : ""}
                onClick={() => handleToggleSide()}
                disabled={mirrorSide === 0}
              >
                Left → Right
              </Button>
              <Button
                variant={mirrorSide === 1 ? "default" : "outline"}
                className={mirrorSide === 1 ? "bg-editor-purple" : ""}
                onClick={() => handleToggleSide()}
                disabled={mirrorSide === 1}
              >
                Right → Left
              </Button>
            </div>
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
