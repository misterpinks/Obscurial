
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
      onClick={() => {
        // Call the randomize function
        onRandomize();
        // Add a slight delay to ensure state updates before processing
        setTimeout(() => {
          // Dispatch a change event to trigger reprocessing
          const event = new Event('sliderchange', { bubbles: true });
          document.dispatchEvent(event);
        }, 50);
      }}
    >
      <Shuffle className="h-4 w-4 mr-2" />
      Randomize Features
    </Button>
  );
};

export default RandomizeButton;
