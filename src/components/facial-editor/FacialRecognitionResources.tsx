
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface RecognitionResource {
  name: string;
  url: string;
  description: string;
  category: 'commercial' | 'search' | 'privacy';
}

const resources: RecognitionResource[] = [
  {
    name: "ClarityCheck",
    url: "https://claritycheck.com/",
    description: "Identity verification service that uses facial recognition to authenticate individuals.",
    category: 'commercial'
  },
  {
    name: "Clearview AI",
    url: "https://www.clearview.ai/",
    description: "Controversial facial recognition system used by law enforcement to identify persons of interest.",
    category: 'commercial'
  },
  {
    name: "PimEyes",
    url: "https://pimeyes.com",
    description: "Facial recognition search engine that finds where your face appears online.",
    category: 'search'
  },
  {
    name: "Lenso.ai",
    url: "https://lenso.ai",
    description: "Visual search technology that can find similar images across the web.",
    category: 'search'
  },
  {
    name: "Pixsy",
    url: "https://www.pixsy.com/",
    description: "Image monitoring service that helps photographers find unauthorized uses of their work.",
    category: 'search'
  },
  {
    name: "SauceNAO",
    url: "https://saucenao.com/",
    description: "Reverse image search engine specialized in finding the source of anime/manga artworks.",
    category: 'search'
  },
  {
    name: "TinEye",
    url: "https://tineye.com/",
    description: "Reverse image search engine that can find exact matches of an image across the web.",
    category: 'search'
  },
  {
    name: "Yandex Images",
    url: "https://yandex.com/images/",
    description: "Russian search engine with powerful reverse image search capabilities.",
    category: 'search'
  },
  {
    name: "Google Lens",
    url: "https://lens.google/",
    description: "Google's visual search tool that can identify objects, text, and faces in images.",
    category: 'search'
  },
  {
    name: "GDPR Guidelines on Facial Recognition",
    url: "https://gdpr.eu/facial-recognition/",
    description: "Information about how GDPR regulates the use of facial recognition in Europe.",
    category: 'privacy'
  },
  {
    name: "EFF: Face Recognition",
    url: "https://www.eff.org/issues/face-recognition",
    description: "Electronic Frontier Foundation's resources on facial recognition and privacy.",
    category: 'privacy'
  }
];

const FacialRecognitionResources = () => {
  const searchResources = resources.filter(r => r.category === 'search');
  const commercialResources = resources.filter(r => r.category === 'commercial');
  const privacyResources = resources.filter(r => r.category === 'privacy');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Facial Recognition Resources</CardTitle>
        <CardDescription>
          Learn about facial recognition technology and tools available online
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="search">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="search">Search Engines</TabsTrigger>
            <TabsTrigger value="commercial">Commercial Tools</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              These tools can find where your face or similar images appear across the web:
            </p>
            {searchResources.map((resource) => (
              <div key={resource.name} className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{resource.name}</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(resource.url, '_blank')}
                    className="flex items-center"
                  >
                    Visit <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                <Separator className="my-2" />
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="commercial" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Commercial facial recognition services used by businesses and governments:
            </p>
            {commercialResources.map((resource) => (
              <div key={resource.name} className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{resource.name}</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(resource.url, '_blank')}
                    className="flex items-center"
                  >
                    Visit <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                <Separator className="my-2" />
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Resources to learn about privacy concerns and regulations around facial recognition:
            </p>
            {privacyResources.map((resource) => (
              <div key={resource.name} className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{resource.name}</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(resource.url, '_blank')}
                    className="flex items-center"
                  >
                    Visit <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                <Separator className="my-2" />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start">
        <p className="text-xs text-muted-foreground">
          Note: This tool is provided for educational purposes only. Using facial recognition technology may be subject to legal restrictions in many jurisdictions. Always respect privacy laws and obtain proper consent when applicable.
        </p>
      </CardFooter>
    </Card>
  );
};

export default FacialRecognitionResources;
