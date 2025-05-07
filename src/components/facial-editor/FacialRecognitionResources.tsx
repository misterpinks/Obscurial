
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from 'lucide-react';

const FacialRecognitionResources: React.FC = () => {
  const resources = [
    { name: "FaceCheck.ID", url: "https://facecheck.id/", description: "Face Search & Verification Service" },
    { name: "PimEyes", url: "https://pimeyes.com/", description: "Face Search Engine" },
    { name: "ClearviewAI", url: "https://www.clearview.ai/", description: "Face Recognition Technology" },
    { name: "FindClone", url: "https://findclone.ru/", description: "Face Search Service" },
    { name: "ProFaceFinder", url: "https://profacefinder.com/", description: "Facial Recognition Search" },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-2">Facial Recognition Resources</h3>
        <p className="text-sm text-muted-foreground mb-3">
          These services can identify people from face photos. Test your privacy-protected images against them.
        </p>
        <ul className="space-y-2">
          {resources.map((resource) => (
            <li key={resource.name} className="text-sm flex items-center">
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline flex items-center"
              >
                <ExternalLink size={14} className="mr-1" />
                {resource.name}
              </a>
              <span className="mx-1">-</span>
              <span className="text-muted-foreground">{resource.description}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default FacialRecognitionResources;
