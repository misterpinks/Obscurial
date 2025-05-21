
import React from 'react';
import RandomizeButton from '../RandomizeButton';
import AdjustmentSliders from '../AdjustmentSliders';
import FaceMirrorControls from '../FaceMirrorControls';

interface AdjustmentControlsSectionProps {
  featureSliders: any[];
  sliderValues: Record<string, number>;
  onSliderChange: (id: string, value: number) => void;
  onSliderChangeComplete?: () => void;
  onResetSliders: () => void;
  onRandomizeSliders: () => void;
  faceMaskSelector?: React.ReactNode;
  onToggleMirror?: () => void;
  onToggleMirrorSide?: () => void;
  mirrorOffsetX?: number;
  mirrorAngle?: number;
  mirrorCutoffY?: number;
  onMirrorOffsetChange?: (value: number) => void;
  onMirrorOffsetChangeComplete?: () => void;
  onMirrorAngleChange?: (value: number) => void;
  onMirrorAngleChangeComplete?: () => void;
  onMirrorCutoffChange?: (value: number) => void;
  onMirrorCutoffChangeComplete?: () => void;
}

const AdjustmentControlsSection: React.FC<AdjustmentControlsSectionProps> = ({
  featureSliders,
  sliderValues,
  onSliderChange,
  onSliderChangeComplete,
  onResetSliders,
  onRandomizeSliders,
  faceMaskSelector,
  onToggleMirror,
  onToggleMirrorSide,
  mirrorOffsetX = 0,
  mirrorAngle = 0,
  mirrorCutoffY = 1,
  onMirrorOffsetChange,
  onMirrorOffsetChangeComplete,
  onMirrorAngleChange,
  onMirrorAngleChangeComplete,
  onMirrorCutoffChange,
  onMirrorCutoffChangeComplete
}) => {
  return (
    <div className="space-y-4">
      <RandomizeButton onRandomize={onRandomizeSliders} />
      
      {/* Add Face Mirroring Controls with advanced options */}
      {onToggleMirror && onToggleMirrorSide && (
        <FaceMirrorControls
          mirrorEnabled={Boolean(sliderValues.mirrorFace) && sliderValues.mirrorFace > 0}
          mirrorSide={sliderValues.mirrorSide || 0}
          mirrorOffsetX={mirrorOffsetX}
          mirrorAngle={mirrorAngle}
          mirrorCutoffY={mirrorCutoffY}
          onToggleMirror={onToggleMirror}
          onToggleSide={onToggleMirrorSide}
          onOffsetChange={onMirrorOffsetChange}
          onOffsetChangeComplete={onMirrorOffsetChangeComplete}
          onAngleChange={onMirrorAngleChange}
          onAngleChangeComplete={onMirrorAngleChangeComplete}
          onCutoffChange={onMirrorCutoffChange}
          onCutoffChangeComplete={onMirrorCutoffChangeComplete}
        />
      )}
      
      <AdjustmentSliders 
        featureSliders={featureSliders}
        sliderValues={sliderValues}
        onSliderChange={onSliderChange}
        onSliderChangeComplete={onSliderChangeComplete}
        onReset={onResetSliders}
        faceMaskSelector={faceMaskSelector}
      />
    </div>
  );
};

export default AdjustmentControlsSection;
