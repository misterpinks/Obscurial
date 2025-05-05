
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface FaceAnalysisProps {
  confidence?: number | null;
  facialDifference?: number | null;
}

const FaceAnalysis: React.FC<FaceAnalysisProps> = ({ 
  confidence, 
  facialDifference 
}) => {
  return (
    <Card className="mt-3">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Face Analysis</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span>Recognition confidence:</span>
                <span className="font-medium">{confidence ? `${Math.round(confidence * 100)}%` : 'No face detected'}</span>
              </li>
              <li className="flex justify-between">
                <span>Facial difference:</span>
                <span className="font-medium">{facialDifference ? 
                  `${facialDifference.toFixed(2)} ${facialDifference > 0.6 ? '(likely defeats recognition)' : '(may not defeat recognition)'}` 
                  : confidence ? 'Analyzing...' : 'N/A'}</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Feature Legend</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#1EAEDB'}}></div>
                <span>Eyes/Eyebrows</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#222222'}}></div>
                <span>Nose</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#ea384c'}}></div>
                <span>Mouth</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#F97316'}}></div>
                <span>Face/Jawline</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full" style={{backgroundColor: '#F2FCE2'}}></div>
                <span>Face Square</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceAnalysis;
