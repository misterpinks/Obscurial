
import { useCallback } from 'react';

interface UseEditorActionsProps {
  resetEffects: () => void;
  resetSliders: () => void;
  toggleAutoAnalyze: () => void;
  autoAnalyze: boolean;
  analyzeModifiedImage: () => void;
}

export const useEditorActions = ({
  resetEffects,
  resetSliders,
  toggleAutoAnalyze,
  autoAnalyze,
  analyzeModifiedImage
}: UseEditorActionsProps) => {
  const handleResetSliders = useCallback(() => {
    resetEffects();
    resetSliders();
  }, [resetEffects, resetSliders]);

  const handleRunAnalysis = useCallback(() => {
    analyzeModifiedImage();
  }, [analyzeModifiedImage]);

  const handleToggleAutoAnalyze = useCallback(() => {
    toggleAutoAnalyze();
  }, [toggleAutoAnalyze]);

  return {
    handleResetSliders,
    handleRunAnalysis,
    handleToggleAutoAnalyze
  };
};
