
import FacialEditor from "@/components/FacialEditor";

const Index = () => {
  return (
    <div className="min-h-screen relative bg-gray-50">
      {/* Background image with fade effect */}
      <div 
        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center" 
        style={{ backgroundImage: "url('/lovable-uploads/7eb2b3f3-5d5b-4df3-adfe-99fd0adafacb.png')" }}
      />
      
      {/* Content container with relative positioning to appear above the background */}
      <div className="relative z-10">
        <FacialEditor />
      </div>
    </div>
  );
};

export default Index;
