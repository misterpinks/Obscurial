
import { useState, useCallback, useEffect } from 'react';

export enum SplitViewMode {
  NONE = 'none',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  DIAGONAL = 'diagonal'
}

export const useSplitView = () => {
  const [splitViewMode, setSplitViewMode] = useState<SplitViewMode>(SplitViewMode.NONE);
  const [splitPosition, setSplitPosition] = useState(0.5); // 0-1 position of divider
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [requestedMode, setRequestedMode] = useState<SplitViewMode | null>(null);

  // Effect to handle mode changes with better debouncing
  useEffect(() => {
    if (requestedMode === null) return;
    
    setIsTransitioning(true);
    
    // Longer delay for mode transitions to prevent flashing
    const transitionTimeout = setTimeout(() => {
      setSplitViewMode(requestedMode);
      
      // End transition after allowing time for render
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }, 100);
    
    return () => clearTimeout(transitionTimeout);
  }, [requestedMode]);

  // Add debounce for mode changes to prevent flash
  const toggleSplitViewMode = useCallback((mode?: SplitViewMode) => {
    if (isTransitioning) return;
    
    if (mode) {
      setRequestedMode(mode);
    } else {
      // Cycle through modes: NONE -> HORIZONTAL -> VERTICAL -> DIAGONAL -> NONE
      setRequestedMode(prev => {
        switch (prev || splitViewMode) {
          case SplitViewMode.NONE:
            return SplitViewMode.HORIZONTAL;
          case SplitViewMode.HORIZONTAL:
            return SplitViewMode.VERTICAL;
          case SplitViewMode.VERTICAL:
            return SplitViewMode.DIAGONAL;
          case SplitViewMode.DIAGONAL:
            return SplitViewMode.NONE;
          default:
            return SplitViewMode.NONE;
        }
      });
    }
  }, [splitViewMode, isTransitioning]);

  const updateSplitPosition = useCallback((position: number) => {
    // Keep position between 0.05 and 0.95 to ensure both sides are visible
    setSplitPosition(Math.min(0.95, Math.max(0.05, position)));
  }, []);

  return {
    splitViewMode,
    splitPosition,
    toggleSplitViewMode,
    updateSplitPosition,
    isTransitioning
  };
};
