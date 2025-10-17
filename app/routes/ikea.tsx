import { useState, useCallback, useRef } from "react";
import { RoomBuilder } from "~/components/Ikea/RoomBuilder";
import { RoomInput } from "~/components/Ikea/RoomInput";
import { Room3D } from "~/components/Ikea/Room3D";

type Step = 1 | 2;

export default function IkeaRoute() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [roomDimensions, setRoomDimensions] = useState<{
    width: number;
    length: number;
  } | null>({ width: 400, length: 500 }); // Default dimensions
  const [furniture, setFurniture] = useState<any[]>([]);
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);
  const isRemovingRef = useRef(false);

  const handleRoomCreate = (width: number, length: number) => {
    setRoomDimensions({ width, length });
    setIsSceneLoaded(false); // Reset scene loaded state when room dimensions change
  };

  const handleFurnitureMove = useCallback((
    id: string,
    position: { x: number; z: number }
  ) => {
    setFurniture((prev) =>
      prev.map((item) => (item.id === id ? { ...item, position } : item))
    );
  }, []);

  const handleFurnitureUpdate = (newFurniture: any[]) => {
    // Skip update if we're in the middle of a remove operation
    if (isRemovingRef.current) {
      return;
    }
    
    setFurniture(newFurniture);
  };

  // Handle furniture menu actions
  const handleFurnitureRemove = (furnitureId: string) => {
    // Set removing flag to prevent circular update
    isRemovingRef.current = true;
    
    setFurniture((prev) => {
      const newFurniture = prev.filter((item) => item.id !== furnitureId);
      return newFurniture;
    });
    
    // Reset removing flag after a short delay
    setTimeout(() => {
      isRemovingRef.current = false;
    }, 100);
  };

  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <div className="container mx-auto px-4 py-4 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Room Builder
          </h1>
          <p className="text-sm text-gray-600">
            Create your perfect 3D room with custom dimensions
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-center space-x-1">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    currentStep >= step ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  {step}
                </div>
                <div className="ml-1 text-xs font-medium text-gray-700">
                  {step === 1 && "Create Room"}
                  {step === 2 && "Furniture"}
                </div>
                {step < 2 && <div className="w-4 h-0.5 bg-gray-300 mx-1"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex max-h-[calc(100vh-200px)]">
          {/* Left Panel - Step Content */}
          <div className="flex-1 mr-4">
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  Step 1: Craet Room 3D
                </h2>
                <div className="flex-1 flex items-center justify-center">
                  <RoomInput onRoomCreate={handleRoomCreate} />
                </div>
                {roomDimensions && (
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Create Room Success!
                    </h3>
                    <div className="mt-4">
                      <button
                        onClick={handleNextStep}
                        disabled={!isSceneLoaded}
                        className={`py-2 px-4 rounded-lg transition-colors ${
                          isSceneLoaded
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        {isSceneLoaded ? "Next →" : "Loading 3D Scene..."}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && roomDimensions && (
              <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Step 2: Add Furniture to Room
                  </h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <RoomBuilder
                    width={roomDimensions.width}
                    length={roomDimensions.length}
                    onFurnitureMove={handleFurnitureMove}
                    onFurnitureUpdate={handleFurnitureUpdate}
                    furniture={furniture}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Fixed 3D Model */}
          <div className="w-1/2 bg-white rounded-lg shadow-lg p-4 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              3D Room View
            </h3>
            <div className="flex-1 overflow-hidden">
              <Room3D
                width={roomDimensions?.width || 400}
                length={roomDimensions?.length || 500}
                furniture={furniture}
                onFurnitureMove={handleFurnitureMove}
                onFurnitureRemove={handleFurnitureRemove}
                onSceneLoaded={setIsSceneLoaded}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
