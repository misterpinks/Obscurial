
import React from 'react';
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

interface RandomizeButtonProps {
  onRandomize: () => void;
}

const RandomizeButton: React.FC<RandomizeButtonProps> = ({ onRandomize }) => {
  const handleClick = () => {
    // First call the randomize function to update state
    onRandomize();
    
    // Use a slightly longer timeout to ensure state updates have completed
    // This ensures image processing happens after slider values are fully updated
    setTimeout(() => {
      // Dispatch a custom event to trigger reprocessing
      const event = new CustomEvent('sliderValueChange', { 
        bubbles: true,
        detail: { source: 'randomize' }
      });
      document.dispatchEvent(event);
    }, 50); // Increased timeout for more reliable state updates
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
