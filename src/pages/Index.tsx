
import FacialEditor from "@/components/facial-editor/FacialEditor";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

const Index = () => {
  const [bgImagePath, setBgImagePath] = useState<string>('./Background.png');
  
  // Handle different environments for background image
  useEffect(() => {
    // For Electron, use the resources path
    if (window.electron) {
      setBgImagePath(window.electron.getResourcePath('ui/Background.png') || './Background.png');
    } else {
      // For web, use the public path instead of src path
      setBgImagePath('./Background.png');
    }
  }, []);
  
  return (
    <div className="min-h-screen relative bg-gray-50">
      {/* Background image with fade effect */}
      <div 
        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center" 
        style={{ backgroundImage: `url('${bgImagePath}')` }}
      />
      
      {/* Content container with relative positioning to appear above the background */}
      <div className="relative z-10">
        <FacialEditor />
      </div>
      
      {/* Add Toaster for notifications */}
      <Toaster />
    </div>
  );
};

export default Index;
