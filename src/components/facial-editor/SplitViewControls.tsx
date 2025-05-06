
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SplitViewMode } from './hooks/useSplitView';
import { SplitVertical, SplitHorizontal, Copy } from 'lucide-react';

interface SplitViewControlsProps {
  mode: SplitViewMode;
  onChange: (mode: SplitViewMode) => void;
}

const SplitViewControls: React.FC<SplitViewControlsProps> = ({ mode, onChange }) => {
  return (
    <div className="flex space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === SplitViewMode.HORIZONTAL ? "default" : "outline"}
              size="icon"
              onClick={() => onChange(
                mode === SplitViewMode.HORIZONTAL ? SplitViewMode.NONE : SplitViewMode.HORIZONTAL
              )}
              className="h-9 w-9"
            >
              <SplitHorizontal className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Horizontal split view</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === SplitViewMode.VERTICAL ? "default" : "outline"}
              size="icon"
              onClick={() => onChange(
                mode === SplitViewMode.VERTICAL ? SplitViewMode.NONE : SplitViewMode.VERTICAL
              )}
              className="h-9 w-9"
            >
              <SplitVertical className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Vertical split view</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === SplitViewMode.DIAGONAL ? "default" : "outline"}
              size="icon"
              onClick={() => onChange(
                mode === SplitViewMode.DIAGONAL ? SplitViewMode.NONE : SplitViewMode.DIAGONAL
              )}
              className="h-9 w-9"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Diagonal split view</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SplitViewControls;
