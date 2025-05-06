
import React from 'react';
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

interface RandomizeButtonProps {
  onRandomize: () => void;
}

const RandomizeButton: React.FC<RandomizeButtonProps> = ({ onRandomize }) => {
  const handleClick = () => {
    onRandomize();
    
    // Dispatch event to trigger reprocessing after state updates
    setTimeout(() => {
      document.dispatchEvent(new Event('sliderchange', { bubbles: true }));
    }, 10);
  };

  return (
    <Button 
      className="w-full bg-editor-purple hover:bg-editor-accent"
      onClick={handleClick}
    >
      <Shuffle className="h-4 w-4 mr-2" />
      Randomize Features
    </Button>
  );
};

export default RandomizeButton;
