import type { MetaFunction } from "@remix-run/node";
import BabylonScene from "~/components/BabylonScene";

export const meta: MetaFunction = () => {
  return [
    { title: "GLTF Model Viewer" },
    { name: "description", content: "Simple GLTF model viewer with Babylon.js" },
  ];
};

export default function Index() {
  return (
    <div className="w-full h-screen relative">
      <BabylonScene />
      
      {/* Instructions Panel */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg max-w-xs">
        <h3 className="text-lg font-semibold mb-2">Controls</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Mouse drag:</strong> Rotate camera</li>
          <li>• <strong>Scroll:</strong> Zoom in/out</li>
          <li>• <strong>Right click + drag:</strong> Pan camera</li>
          <li>• <strong>Double click:</strong> Reset camera</li>
        </ul>
      </div>
    </div>
  );
}
