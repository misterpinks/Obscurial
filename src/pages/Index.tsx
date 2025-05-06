
import FacialEditor from "@/components/facial-editor/FacialEditor";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  // Create a dynamic background path that works in both web and electron
  const bgImagePath = process.env.ELECTRON_RUN ? './Background.png' : './src/components/ui/Background.png';
  
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
