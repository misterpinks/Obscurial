
import { useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useEditorActions = (
  resetEffects: () => void,
  resetSliders: () => void,
  toggleAutoAnalyze: () => void,
  autoAnalyze: boolean,
  analyzeModifiedImage?: () => Promise<void>
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

  const handleRunAnalysis = useCallback(async () => {
    if (!analyzeModifiedImage) {
      console.error("analyzeModifiedImage function not provided to useEditorActions");
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Analysis function not available. Please try reloading the page."
      });
      return;
    }

    console.log('Starting manual analysis from handleRunAnalysis...');
    toast({
      title: "Analysis Started",
      description: "Analyzing facial changes..."
    });
    
    try {
      await analyzeModifiedImage();
      console.log('Manual analysis completed successfully');
    } catch (error) {
      console.error('Analysis failed in handleRunAnalysis:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not complete analysis. Please try again."
      });
    }
  }, [analyzeModifiedImage, toast]);

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
