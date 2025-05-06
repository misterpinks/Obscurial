
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

const MAX_HISTORY_LENGTH = 20;

export const useHistory = <T>(initialState: T) => {
  const { toast } = useToast();
  const [states, setStates] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get current state
  const currentState = states[currentIndex];

  // Push a new state to history
  const pushState = useCallback((newState: T) => {
    setStates(prev => {
      // Remove any future states (if we've gone back and then made changes)
      const updatedStates = prev.slice(0, currentIndex + 1);
      // Add the new state
      updatedStates.push(newState);
      // Limit history length
      if (updatedStates.length > MAX_HISTORY_LENGTH) {
        updatedStates.shift();
      }
      return updatedStates;
    });
    setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
  }, [currentIndex]);

  // Undo - go back to previous state
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      toast({
        title: "Undo",
        description: "Changed reverted to previous state"
      });
      return true;
    }
    toast({
      title: "Cannot Undo",
      description: "No previous state available",
      variant: "destructive"
    });
    return false;
  }, [currentIndex, toast]);

  // Redo - go forward to next state
  const redo = useCallback(() => {
    if (currentIndex < states.length - 1) {
      setCurrentIndex(currentIndex + 1);
      toast({
        title: "Redo",
        description: "Change restored"
      });
      return true;
    }
    toast({
      title: "Cannot Redo",
      description: "No future state available",
      variant: "destructive"
    });
    return false;
  }, [currentIndex, states, toast]);

  // Can undo/redo
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < states.length - 1;

  return {
    state: currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  };
};
