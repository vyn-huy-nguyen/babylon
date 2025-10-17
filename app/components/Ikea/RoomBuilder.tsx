import { useState, useEffect } from "react";

interface RoomBuilderProps {
  width: number;
  length: number;
  onFurnitureMove?: (id: string, position: { x: number; z: number }) => void;
  onFurnitureUpdate?: (furniture: FurnitureItem[]) => void;
}

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  color: string;
  position: { x: number; z: number };
  rotation: number;
  modelFile: string;
  scale: number;
  yOffset: number;
}

export function RoomBuilder({
  width,
  length,
  onFurnitureMove,
  onFurnitureUpdate,
}: RoomBuilderProps) {
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(
    null
  );

  const furnitureCatalog = [
    {
      name: "Table",
      category: "Seating",
      color: "#8B4513",
      modelFile: "table.glb",
      scale: 0.2,
      yOffset: 0.1,
    },
    {
      name: "Chair",
      category: "Seating",
      color: "#654321",
      modelFile: "chair.glb",
      scale: 1,
      yOffset: 0.55,
    },
  ];

  const addFurniture = (item: (typeof furnitureCatalog)[0]) => {
    const newFurniture: FurnitureItem = {
      id: `${item.name}_${Date.now()}`,
      name: item.name,
      category: item.category,
      color: item.color,
      position: { x: 0, z: 0 }, // Đặt ở giữa phòng (0,0)
      rotation: 0,
      modelFile: item.modelFile,
      scale: item.scale,
      yOffset: item.yOffset,
    };
    setFurniture((prev) => [...prev, newFurniture]);
  };

  // Notify parent when furniture changes
  useEffect(() => {
    if (onFurnitureUpdate) {
      onFurnitureUpdate(furniture);
    }
  }, [furniture, onFurnitureUpdate]);

  const removeFurniture = (id: string) => {
    setFurniture((prev) => prev.filter((item) => item.id !== id));
    if (selectedFurniture === id) {
      setSelectedFurniture(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex-1">
        {/* Furniture Panel */}
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Furniture Catalog
          </h3>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {furnitureCatalog.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => addFurniture(item)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Furniture List */}
      {furniture.length > 0 && (
        <div className="mt-2" style={{ height: "120px" }}>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Added Furniture ({furniture.length} items)
          </h3>
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {furniture.map((item) => (
                <div
                  key={item.id}
                  className={`p-2 rounded border transition-colors cursor-pointer ${
                    selectedFurniture === item.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setSelectedFurniture(
                      selectedFurniture === item.id ? null : item.id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-gray-800 text-xs">
                        {item.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFurniture(item.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
