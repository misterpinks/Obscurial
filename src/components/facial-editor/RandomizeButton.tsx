
import React from 'react';
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

interface RandomizeButtonProps {
  onRandomize: () => void;
}

const RandomizeButton: React.FC<RandomizeButtonProps> = ({ onRandomize }) => {
  return (
    <Button 
      className="w-full bg-editor-purple hover:bg-editor-accent"
      onClick={onRandomize}
      type="button"
    >
      <Shuffle className="h-4 w-4 mr-2" />
      Randomize Features
    </Button>
  );
};

export default RandomizeButton;
