
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ResourceItem {
  name: string;
  url: string;
  description: string;
}

const FacialRecognitionResources: React.FC = () => {
  const resources: ResourceItem[] = [
    { 
      name: "ClarityCheck",
      url: "https://claritycheck.com/",
      description: "Facial recognition service that performs identity verification and background checks."
    },
    { 
      name: "Clearview AI",
      url: "https://www.clearview.ai/",
      description: "Facial recognition technology company that provides tools to law enforcement agencies."
    },
    { 
      name: "PimEyes",
      url: "https://pimeyes.com",
      description: "Online face search engine that uses facial recognition to search for images."
    },
    { 
      name: "Lenso.ai",
      url: "https://lenso.ai",
      description: "AI-powered image recognition platform with facial search capabilities."
    },
    { 
      name: "Pixsy",
      url: "https://pixsy.com",
      description: "Image monitoring and legal service that helps protect your online content."
    },
    { 
      name: "SauceNAO",
      url: "https://saucenao.com",
      description: "Reverse image search engine focused on finding the source of anime/manga images."
    },
    { 
      name: "TinEye",
      url: "https://tineye.com",
      description: "Reverse image search engine specialized in finding where images appear online."
    },
    { 
      name: "Yandex Images",
      url: "https://yandex.com/images/",
      description: "Reverse image search by Russian search engine Yandex with powerful facial recognition."
    },
    { 
      name: "Google Lens",
      url: "https://lens.google.com",
      description: "Google's image recognition technology that can identify objects in images."
    },
    { 
      name: "ProFaceFinder",
      url: "https://profacefinder.com/",
      description: "Advanced facial recognition search engine for finding people across the web."
    },
    { 
      name: "FaceCheck.ID",
      url: "https://facecheck.id/",
      description: "Facial recognition service that can help identify people from uploaded photos."
    }
  ];

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-blue-800">
          Facial Recognition Resources
        </CardTitle>
        <CardDescription>
          Popular platforms that use facial recognition technology to find images across the web.
          Understanding these tools can help protect your privacy online.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div key={resource.name} className="border rounded-lg p-3 hover:bg-blue-50 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-blue-700">{resource.name}</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-blue-600 hover:text-blue-800"
                  onClick={() => window.open(resource.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visit
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{resource.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FacialRecognitionResources;
