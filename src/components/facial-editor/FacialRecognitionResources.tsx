
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';

const FacialRecognitionResources: React.FC = () => {
  const resources = [
    { 
      name: "FaceCheck.ID", 
      url: "https://facecheck.id/", 
      description: "Reverse image search engine specifically for faces. Can scan for face photos across social media."
    },
    { 
      name: "PimEyes", 
      url: "https://pimeyes.com/", 
      description: "Advanced facial recognition search engine that can find faces across millions of websites."
    },
    { 
      name: "ClearviewAI", 
      url: "https://www.clearview.ai/", 
      description: "Powerful facial recognition platform used by law enforcement with an extensive database of faces."
    },
    { 
      name: "FindClone", 
      url: "https://findclone.ru/", 
      description: "Russian face search service that can identify people from photographs with high accuracy."
    },
    { 
      name: "ProFaceFinder", 
      url: "https://profacefinder.com/", 
      description: "Specialized search engine for finding faces across multiple platforms and databases."
    },
    { 
      name: "ClarityCheck", 
      url: "https://claritycheck.com/", 
      description: "Face analysis and verification service that can match identities across different images."
    },
    { 
      name: "Lenso.ai", 
      url: "https://lenso.ai/", 
      description: "AI-powered image search specializing in facial recognition and visual similarity."
    },
    { 
      name: "Pixsy", 
      url: "https://www.pixsy.com/", 
      description: "Image monitoring service that helps track unauthorized use of photos online."
    },
    { 
      name: "SauceNAO", 
      url: "https://saucenao.com/", 
      description: "Multi-source image search engine that can identify people in anime, art, and photographs."
    },
    { 
      name: "TinEye", 
      url: "https://tineye.com/", 
      description: "Reverse image search engine that can find exact matches and modified versions of images."
    },
    { 
      name: "Yandex Images", 
      url: "https://yandex.com/images/", 
      description: "Russian search engine with powerful face recognition capabilities in its image search."
    },
    { 
      name: "Google Lens", 
      url: "https://lens.google/", 
      description: "Google's visual search tool that can identify people, places, and things in images."
    },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-2">Facial Recognition Resources</h3>
        <p className="text-sm text-muted-foreground mb-3">
          These services can identify people from face photos. Test your privacy-protected images against them to verify effectiveness.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div key={resource.name} className="border rounded-md p-3 bg-slate-50 shadow-sm">
              <h4 className="font-medium text-sm mb-1">{resource.name}</h4>
              <p className="text-xs text-muted-foreground mb-2 h-12 overflow-y-auto">
                {resource.description}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center"
                onClick={() => window.open(resource.url, '_blank')}
              >
                <ExternalLink size={14} className="mr-1" />
                Visit Site
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FacialRecognitionResources;
