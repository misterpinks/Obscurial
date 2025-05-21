
import React from 'react';

interface ControlTipsProps {
  enableZoom?: boolean;
  enableMaskControl?: boolean;
}

const ControlTips: React.FC<ControlTipsProps> = ({ enableZoom, enableMaskControl }) => {
  if (!enableZoom && !enableMaskControl) return null;
  
  return (
    <div className="text-xs text-gray-500 mt-1">
      {enableZoom && <p>Scroll to zoom</p>}
      {enableMaskControl && <p>Drag mask | +/- keys to resize</p>}
    </div>
  );
};

export default ControlTips;
