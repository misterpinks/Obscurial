
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from "@/components/ui/card";

interface SimpleSliderProps {
  label: string;
  initialValue: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  color?: string;
}

const SimpleSlider = ({
  label,
  initialValue,
  onChange,
  min,
  max,
  step = 1,
  color = "#1EAEDB"
}: SimpleSliderProps) => {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Calculate percentage for visual representation
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Handler functions using useCallback to maintain reference stability
  const calculateValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return value;
    
    const { left, width } = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - left) / width));
    const newValue = Math.round((percentage * (max - min) + min) / step) * step;
    
    return Math.max(min, Math.min(max, newValue));
  }, [min, max, step, value]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Calculate and set initial value on click
    const newValue = calculateValueFromPosition(e.clientX);
    setValue(newValue);
    onChange(newValue);
    
    // Capture the document events
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  }, [calculateValueFromPosition, onChange]);
  
  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newValue = calculateValueFromPosition(e.clientX);
    setValue(newValue);
    onChange(newValue);
  }, [isDragging, calculateValueFromPosition, onChange]);
  
  const handleDocumentMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Remove document event listeners
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
  }, [handleDocumentMouseMove]);
  
  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const touch = e.touches[0];
    const newValue = calculateValueFromPosition(touch.clientX);
    setValue(newValue);
    onChange(newValue);
    
    // Capture the document events
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd);
  }, [calculateValueFromPosition, onChange]);
  
  const handleDocumentTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    // Prevent scrolling while dragging
    e.preventDefault();
    
    const touch = e.touches[0];
    const newValue = calculateValueFromPosition(touch.clientX);
    setValue(newValue);
    onChange(newValue);
  }, [isDragging, calculateValueFromPosition, onChange]);
  
  const handleDocumentTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    // Remove document event listeners
    document.removeEventListener('touchmove', handleDocumentTouchMove);
    document.removeEventListener('touchend', handleDocumentTouchEnd);
  }, [handleDocumentTouchMove]);
  
  // Sync with external value changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, [handleDocumentMouseMove, handleDocumentMouseUp, handleDocumentTouchMove, handleDocumentTouchEnd]);

  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between text-sm">
        <span style={{ color }}>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      
      <div 
        ref={sliderRef}
        className="relative h-2 w-full cursor-pointer rounded-full bg-gray-200"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track fill */}
        <div 
          className="absolute h-full rounded-full" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color 
          }}
        />
        
        {/* Thumb */}
        <div 
          className="absolute h-4 w-4 -top-1 rounded-full border-2 bg-white cursor-grab active:cursor-grabbing"
          style={{ 
            left: `calc(${percentage}% - 8px)`,
            borderColor: color 
          }}
        />
      </div>
    </div>
  );
};

export default SimpleSlider;
