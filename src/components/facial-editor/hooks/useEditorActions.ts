
import { useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useEditorActions = (
  resetEffects: () => void,
  resetSliders: () => void,
  toggleAutoAnalyze: () => void,
  autoAnalyze: boolean
) => {
  const { toast } = useToast();

  const handleResetSliders = useCallback(() => {
    resetSliders();
    resetEffects();
    toast({
      title: "Settings Reset",
      description: "All adjustments have been reset to default values."
    });
  }, [resetSliders, resetEffects, toast]);

  const handleRunAnalysis = useCallback(() => {
    toast({
      title: "Analysis Started",
      description: "Analyzing facial changes..."
    });
  }, [toast]);

  const handleToggleAutoAnalyze = useCallback(() => {
    toggleAutoAnalyze();
    toast({
      title: autoAnalyze ? "Auto-Analysis Disabled" : "Auto-Analysis Enabled",
      description: autoAnalyze 
        ? "You'll need to manually run analysis now."
        : "Analysis will run automatically when making adjustments."
    });
  }, [toggleAutoAnalyze, autoAnalyze, toast]);

  return {
    handleResetSliders,
    handleRunAnalysis,
    handleToggleAutoAnalyze
  };
};
