
import React from 'react';
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface RandomizeButtonProps {
  onRandomize: () => void;
}

const RandomizeButton: React.FC<RandomizeButtonProps> = ({ onRandomize }) => {
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Provide feedback to user
    toast({
      title: "Randomizing features",
      description: "Applying random adjustments to facial features"
    });
    
    onRandomize();
    console.log("Randomize button clicked, onRandomize function called");
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
