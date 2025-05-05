
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loadModelsFromGitHub, downloadFaceApiModels } from '@/utils/downloadModels';
import { AlertCircle, Download, Check } from 'lucide-react';

const ModelSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDownloadingManually, setIsDownloadingManually] = useState(false);

  const handleLoadModels = async () => {
    setIsLoading(true);
    const success = await loadModelsFromGitHub();
    setIsLoading(false);
    setIsSuccess(success);
    
    // Reload the page to apply changes
    if (success) {
      window.location.reload();
    }
  };

  const handleDownloadManually = async () => {
    setIsDownloadingManually(true);
    await downloadFaceApiModels();
    setIsDownloadingManually(false);
  };

  if (isSuccess) {
    return (
      <Alert className="bg-green-50 border-green-200 mb-6">
        <Check className="h-5 w-5 text-green-600" />
        <AlertTitle>Models loaded successfully</AlertTitle>
        <AlertDescription>
          Face recognition models are now ready to use.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-6">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertTitle>Face recognition models required</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          Face-api.js requires model files to function. We'll load them directly from GitHub.
        </p>
        
        <Button 
          onClick={handleLoadModels} 
          disabled={isLoading}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {isLoading ? 'Loading models...' : 'Load Face Recognition Models'}
        </Button>
        
        {isLoading && (
          <div className="text-sm text-muted-foreground mt-2">
            <p>Please wait while we load the models directly from GitHub...</p>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Alternatively, you can download the models manually:
          </p>
          <Button 
            variant="outline"
            onClick={handleDownloadManually} 
            disabled={isDownloadingManually}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloadingManually ? 'Preparing downloads...' : 'Download model files'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ModelSetup;
