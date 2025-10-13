import { useEffect, useRef } from "react";

export default function IFCViewer() {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // TODO: init three.js + web-ifc-three here
    console.log("IFC Viewer initialized");
  }, []);
  
  return (
    <div ref={ref} className="h-[60vh] w-full border rounded-2xl bg-gray-50 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-lg font-semibold mb-2">3D IFC Viewer</div>
        <div className="text-sm">IFC.js viewer will be integrated here</div>
      </div>
    </div>
  );
}
