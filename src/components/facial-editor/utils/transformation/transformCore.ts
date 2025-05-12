
/**
 * Core transformation utilities for applying transformations to images
 * Enhanced with superior transition handling and advanced interpolation techniques
 */

// Helper for calculating ultra-smooth transition zones with advanced sigmoid-based curves
export const calculateTransitionFactor = (
  distFromCenter: number,
  innerEdge: number,
  maxInfluenceDistance: number
): number => {
  if (distFromCenter <= innerEdge) return 1.0;
  if (distFromCenter >= maxInfluenceDistance) return 0.0;
  
  // Calculate normalized position in transition zone
  const t = (distFromCenter - innerEdge) / (maxInfluenceDistance - innerEdge);
  
  // Use enhanced smoothstep function (septic curve) for ultra-smooth transitions
  // This creates an even more gradual transition with no visible boundaries
  // 7th degree polynomial for maximum smoothness: 20t^7 - 70t^6 + 84t^5 - 35t^4 + 1
  const t2 = t*t;
  const t4 = t2*t2;
  const t3 = t2*t;
  const t7 = t4*t3;
  const t6 = t3*t3;
  const t5 = t4*t;
  
  return 1.0 - (20*t7 - 70*t6 + 84*t5 - 35*t4);
};

// Helper for bilinear interpolation with advanced edge handling
export const bilinearInterpolation = (
  originalData: ImageData,
  x: number, 
  y: number, 
  width: number,
  height: number,
  outputData: ImageData,
  index: number
): void => {
  // Calculate safe coordinates with extra boundary padding
  // Ensure coordinates stay well within bounds with additional safety margin
  const safetyMargin = 3; // Increased safety margin
  const sampleX = Math.max(safetyMargin, Math.min(width - safetyMargin - 1, x));
  const sampleY = Math.max(safetyMargin, Math.min(height - safetyMargin - 1, y));
  
  const x1 = Math.floor(sampleX);
  const y1 = Math.floor(sampleY);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  const xWeight = sampleX - x1;
  const yWeight = sampleY - y1;
  
  // Pre-calculate offsets for performance
  const topLeftOffset = (y1 * width + x1) * 4;
  const topRightOffset = (y1 * width + x2) * 4;
  const bottomLeftOffset = (y2 * width + x1) * 4;
  const bottomRightOffset = (y2 * width + x2) * 4;
  
  // Use higher-order interpolation for even smoother results (enhanced from cubic)
  for (let i = 0; i < 3; i++) {
    // Get corner values
    const topLeft = originalData.data[topLeftOffset + i];
    const topRight = originalData.data[topRightOffset + i];
    const bottomLeft = originalData.data[bottomLeftOffset + i];
    const bottomRight = originalData.data[bottomRightOffset + i];
    
    // Advanced bicubic interpolation for even smoother results
    const xWeight2 = xWeight * xWeight;
    const xWeight3 = xWeight2 * xWeight;
    
    // Advanced hermite interpolation with reduced oscillation
    const hx1 = 2*xWeight3 - 3*xWeight2 + 1;
    const hx2 = -2*xWeight3 + 3*xWeight2;
    
    const top = topLeft * hx1 + topRight * hx2;
    const bottom = bottomLeft * hx1 + bottomRight * hx2;
    
    // Similar interpolation for vertical direction
    const yWeight2 = yWeight * yWeight;
    const yWeight3 = yWeight2 * yWeight;
    
    const hy1 = 2*yWeight3 - 3*yWeight2 + 1;
    const hy2 = -2*yWeight3 + 3*yWeight2;
    
    // Combine horizontal and vertical interpolations
    outputData.data[index + i] = Math.round(top * hy1 + bottom * hy2);
  }
  
  // Alpha channel stays the same
  outputData.data[index + 3] = originalData.data[topLeftOffset + 3];
};

// Helper to copy pixel directly from source to destination
export const copyPixel = (
  originalData: ImageData,
  outputData: ImageData,
  sourceIndex: number,
  destIndex: number
): void => {
  outputData.data[destIndex] = originalData.data[sourceIndex];
  outputData.data[destIndex + 1] = originalData.data[sourceIndex + 1];
  outputData.data[destIndex + 2] = originalData.data[sourceIndex + 2];
  outputData.data[destIndex + 3] = originalData.data[sourceIndex + 3];
};

// Generate a displacement vector field visualization
export const generateVectorFieldVisualization = (
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  halfFaceWidth: number,
  halfFaceHeight: number,
  sliderValues: Record<string, number>,
  amplificationFactor: number
): ImageData => {
  const { getDisplacement } = require('../facialRegions');
  const vectorCanvas = document.createElement('canvas');
  vectorCanvas.width = width;
  vectorCanvas.height = height;
  const vectorCtx = vectorCanvas.getContext('2d');
  
  if (!vectorCtx) {
    throw new Error("Could not create vector visualization context");
  }
  
  // Clear background
  vectorCtx.fillStyle = 'rgba(240, 240, 240, 0.5)';
  vectorCtx.fillRect(0, 0, width, height);
  
  // Draw a grid of vectors
  const gridSpacing = Math.max(20, Math.floor(Math.min(width, height) / 30));
  vectorCtx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
  vectorCtx.lineWidth = 1;
  
  // Draw displacement vectors
  for (let y = gridSpacing; y < height; y += gridSpacing) {
    for (let x = gridSpacing; x < width; x += gridSpacing) {
      // Calculate normalized position
      const normX = (x - centerX) / halfFaceWidth;
      const normY = (y - centerY) / halfFaceHeight;
      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      
      // Get displacement for this position
      const { displacementX, displacementY } = getDisplacement(
        normX, normY, distFromCenter, sliderValues, amplificationFactor
      );
      
      // Calculate magnitude for color intensity
      const magnitude = Math.sqrt(displacementX * displacementX + displacementY * displacementY);
      const normalizedMagnitude = Math.min(1, magnitude * 10);
      
      // Skip very small displacements
      if (magnitude < 0.02) continue;
      
      // Calculate vector endpoint
      const arrowLength = Math.min(gridSpacing * 0.8, magnitude * 40);
      const angle = Math.atan2(displacementY, displacementX);
      const endX = x - Math.cos(angle) * arrowLength;
      const endY = y - Math.sin(angle) * arrowLength;
      
      // Color based on direction and magnitude
      const hue = (Math.atan2(displacementY, displacementX) * 180 / Math.PI + 180) % 360;
      vectorCtx.strokeStyle = `hsla(${hue}, 100%, 50%, ${normalizedMagnitude * 0.8 + 0.2})`;
      
      // Draw the vector
      vectorCtx.beginPath();
      vectorCtx.moveTo(x, y);
      vectorCtx.lineTo(endX, endY);
      
      // Draw arrowhead
      const arrowSize = 3;
      const arrowAngle = Math.PI / 6;
      vectorCtx.lineTo(
        endX + arrowSize * Math.cos(angle + Math.PI - arrowAngle),
        endY + arrowSize * Math.sin(angle + Math.PI - arrowAngle)
      );
      vectorCtx.moveTo(endX, endY);
      vectorCtx.lineTo(
        endX + arrowSize * Math.cos(angle + Math.PI + arrowAngle),
        endY + arrowSize * Math.sin(angle + Math.PI + arrowAngle)
      );
      
      vectorCtx.stroke();
    }
  }
  
  return vectorCtx.getImageData(0, 0, width, height);
};
