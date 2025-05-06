
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

  // Add debounce for mode changes to prevent flash
  const toggleSplitViewMode = useCallback((mode?: SplitViewMode) => {
    setIsTransitioning(true);
    
    // Small delay to prevent screen flashing
    setTimeout(() => {
      if (mode) {
        setSplitViewMode(mode);
      } else {
        setSplitViewMode(prev => {
          // Cycle through modes: NONE -> HORIZONTAL -> VERTICAL -> DIAGONAL -> NONE
          switch (prev) {
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
      
      // End transition after a small delay to allow render
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 50);
  }, []);

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
