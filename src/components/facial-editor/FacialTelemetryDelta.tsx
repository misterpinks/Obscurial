import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface FacialTelemetryDelta {
  overallDistance: number;
  eyeDistances: {
    leftEye: number;
    rightEye: number;
    eyeSpacing: number;
  };
  noseChanges: {
    width: number;
    length: number;
    position: number;
  };
  mouthChanges: {
    width: number;
    height: number;
    position: number;
  };
  faceShape: {
    width: number;
    jawline: number;
    chin: number;
  };
  confidenceChange: number;
}

interface FacialTelemetryDeltaProps {
  telemetryDelta: FacialTelemetryDelta | null;
  isAnalyzing: boolean;
}

const FacialTelemetryDelta: React.FC<FacialTelemetryDeltaProps> = ({
  telemetryDelta,
  isAnalyzing
}) => {
  // Keep track of whether we've ever had telemetry data
  const [hasEverHadData, setHasEverHadData] = React.useState(false);
  
  React.useEffect(() => {
    if (telemetryDelta) {
      setHasEverHadData(true);
    }
  }, [telemetryDelta]);

  const getChangeLevel = (value: number) => {
    if (value < 2) return { level: 'Low', color: 'bg-green-500', variant: 'secondary' as const };
    if (value < 5) return { level: 'Medium', color: 'bg-yellow-500', variant: 'default' as const };
    if (value < 10) return { level: 'High', color: 'bg-orange-500', variant: 'default' as const };
    return { level: 'Very High', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const formatValue = (value: number) => value.toFixed(2);

  // Always show the card - it will show different states based on data availability
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Facial Telemetry Delta Analysis</CardTitle>
        {telemetryDelta && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Change:</span>
            <Badge variant={getChangeLevel(telemetryDelta.overallDistance * 10).variant}>
              {formatValue(telemetryDelta.overallDistance)} ({getChangeLevel(telemetryDelta.overallDistance * 10).level})
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Analyzing facial changes...</p>
            </div>
          </div>
        ) : telemetryDelta ? (
          <div>
            {/* Eye Region Changes */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full bg-blue-500"></div>
                Eye Region Changes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Left Eye</span>
                    <span>{formatValue(telemetryDelta.eyeDistances.leftEye)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.eyeDistances.leftEye * 10, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Right Eye</span>
                    <span>{formatValue(telemetryDelta.eyeDistances.rightEye)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.eyeDistances.rightEye * 10, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Eye Spacing</span>
                    <span>{formatValue(telemetryDelta.eyeDistances.eyeSpacing)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.eyeDistances.eyeSpacing / 2, 100)} className="h-2" />
                </div>
              </div>
            </div>

            {/* Nose Changes */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full bg-yellow-500"></div>
                Nose Changes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Width</span>
                    <span>{formatValue(telemetryDelta.noseChanges.width)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.noseChanges.width * 10, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Length</span>
                    <span>{formatValue(telemetryDelta.noseChanges.length)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.noseChanges.length * 10, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Position</span>
                    <span>{formatValue(telemetryDelta.noseChanges.position)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.noseChanges.position * 10, 100)} className="h-2" />
                </div>
              </div>
            </div>

            {/* Mouth Changes */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full bg-red-500"></div>
                Mouth Changes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Width</span>
                    <span>{formatValue(telemetryDelta.mouthChanges.width)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.mouthChanges.width * 10, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Height</span>
                    <span>{formatValue(telemetryDelta.mouthChanges.height)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.mouthChanges.height * 10, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Position</span>
                    <span>{formatValue(telemetryDelta.mouthChanges.position)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.mouthChanges.position * 10, 100)} className="h-2" />
                </div>
              </div>
            </div>

            {/* Face Shape Changes */}
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <div className="w-3 h-3 mr-2 rounded-full bg-orange-500"></div>
                Face Shape Changes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Width</span>
                    <span>{formatValue(telemetryDelta.faceShape.width)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.faceShape.width * 10, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Jawline</span>
                    <span>{formatValue(telemetryDelta.faceShape.jawline)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.faceShape.jawline * 10, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Chin</span>
                    <span>{formatValue(telemetryDelta.faceShape.chin)}</span>
                  </div>
                  <Progress value={Math.min(telemetryDelta.faceShape.chin * 10, 100)} className="h-2" />
                </div>
              </div>
            </div>

            {/* Recognition Confidence Change */}
            <div>
              <h4 className="font-medium mb-3">Recognition Confidence Change</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Confidence Delta:</span>
                <Badge variant={telemetryDelta.confidenceChange > 0.1 ? 'default' : 'secondary'}>
                  {formatValue(telemetryDelta.confidenceChange * 100)}%
                </Badge>
              </div>
            </div>
          </div>
        ) : hasEverHadData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Analysis completed. Click "Run Analysis" to refresh the data.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Click "Run Analysis" to see detailed facial changes</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FacialTelemetryDelta;
