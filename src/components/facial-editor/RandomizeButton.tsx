
import React from 'react';
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

interface RandomizeButtonProps {
  onRandomize: () => void;
}

const RandomizeButton: React.FC<RandomizeButtonProps> = ({ onRandomize }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRandomize();
  };
  
  return (
    <Button 
      className="w-full bg-editor-purple hover:bg-editor-accent"
      onClick={handleClick}
      type="button"
    >
      <Shuffle className="h-4 w-4 mr-2" />
      Randomize Features
    </Button>
  );
};

export default RandomizeButton;
