
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { downloadFaceApiModels, checkModelsExist } from '@/utils/downloadModels';
import { AlertCircle, Download, Check } from 'lucide-react';

const ModelSetup = () => {
  const [modelsExist, setModelsExist] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const checkModels = async () => {
      const exist = await checkModelsExist();
      setModelsExist(exist);
    };
    
    checkModels();
  }, []);

  const handleDownloadModels = async () => {
    setDownloading(true);
    await downloadFaceApiModels();
    setDownloading(false);
  };

  if (modelsExist === true) {
    return (
      <Alert className="bg-green-50 border-green-200 mb-6">
        <Check className="h-5 w-5 text-green-600" />
        <AlertTitle>Models ready</AlertTitle>
        <AlertDescription>
          Face recognition models are properly installed and ready to use.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-6">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertTitle>Missing model files</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          Face-api.js requires model files to function correctly. These files need to be placed
          in your <code className="bg-gray-100 px-1 rounded">public/models/</code> directory.
        </p>
        
        <Button 
          onClick={handleDownloadModels} 
          disabled={downloading}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Preparing downloads...' : 'Download model files'}
        </Button>
        
        {downloading && (
          <div className="text-sm text-muted-foreground mt-2">
            <p>After downloading:</p>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Save all files to your computer</li>
              <li>Move them to the <code className="bg-gray-100 px-1 rounded">public/models/</code> directory in your project</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ModelSetup;
