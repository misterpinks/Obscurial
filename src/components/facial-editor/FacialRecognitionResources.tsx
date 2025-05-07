
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "lucide-react";

const FacialRecognitionResources: React.FC = () => {
  const resources = [
    {
      category: "Facial Search Engines",
      items: [
        { name: "PimEyes", url: "https://pimeyes.com", description: "Face search engine that finds face matches across the internet" },
        { name: "Clearview AI", url: "https://www.clearview.ai", description: "Facial recognition technology (primarily for law enforcement)" },
        { name: "ProFaceFinder", url: "https://profacefinder.com/", description: "Online facial recognition search engine" },
        { name: "FaceCheck.ID", url: "https://facecheck.id/", description: "Reverse face search engine for identity verification" }
      ]
    },
    {
      category: "Reverse Image Search",
      items: [
        { name: "Google Lens", url: "https://lens.google.com", description: "Visual search tool by Google" },
        { name: "TinEye", url: "https://tineye.com", description: "Reverse image search engine" },
        { name: "Yandex Images", url: "https://yandex.com/images", description: "Image search with strong facial recognition" },
        { name: "SauceNAO", url: "https://saucenao.com", description: "Reverse image search specialized for artwork" }
      ]
    },
    {
      category: "Image Monitoring",
      items: [
        { name: "ClarityCheck", url: "https://claritycheck.com", description: "Image monitoring for digital identity protection" },
        { name: "Lenso.ai", url: "https://lenso.ai", description: "AI-powered image analysis and search" },
        { name: "Pixsy", url: "https://pixsy.com", description: "Find and fight image theft online" }
      ]
    }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <Link className="h-5 w-5 mr-2 text-editor-purple" />
          <h3 className="font-medium">Facial Recognition Resources</h3>
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          Tools and services that can identify faces across the internet. This editor helps protect your privacy against these systems.
        </div>
        
        {resources.map((category, index) => (
          <div key={index} className="mb-4">
            <h4 className="text-sm font-medium mb-2">{category.category}</h4>
            <Separator className="mb-3" />
            
            <ul className="space-y-3">
              {category.items.map((item, idx) => (
                <li key={idx} className="text-sm">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-editor-purple hover:underline"
                  >
                    {item.name}
                  </a>
                  <p className="text-muted-foreground text-xs mt-0.5">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
        
        <div className="text-xs text-muted-foreground mt-4">
          These links are provided for educational purposes only. Please use responsibly and in accordance with applicable laws and terms of service.
        </div>
      </CardContent>
    </Card>
  );
};

export default FacialRecognitionResources;
