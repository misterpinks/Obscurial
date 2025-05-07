
import { useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useEditorActions = (
  resetEffects: () => void,
  resetSliders: () => void,
  toggleAutoAnalyze: () => void,
  autoAnalyze: boolean,
  analyzeModifiedImage?: () => void
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
    
    // Actually run the analysis if the function is provided
    if (analyzeModifiedImage) {
      setTimeout(() => {
        analyzeModifiedImage();
      }, 100); // Small delay to allow toast to render first
    } else {
      console.error("analyzeModifiedImage function not provided to useEditorActions");
    }
  }, [toast, analyzeModifiedImage]);

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
