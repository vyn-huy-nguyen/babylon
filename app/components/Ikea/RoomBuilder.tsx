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
  width: number;
  length: number;
  height: number;
  color: string;
  position: { x: number; z: number };
  rotation: number;
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
      name: "Box",
      category: "Seating",
      width: 2.0,
      length: 0.8,
      height: 0.8,
      color: "#8B4513",
    },
    // { name: 'Coffee Table', category: 'Tables', width: 1.2, length: 0.6, height: 0.4, color: '#D2691E' },
    // { name: 'TV Stand', category: 'Storage', width: 1.2, length: 0.4, height: 0.5, color: '#696969' },
  ];

  const addFurniture = (item: (typeof furnitureCatalog)[0]) => {
    const newFurniture: FurnitureItem = {
      id: `${item.name}_${Date.now()}`,
      name: item.name,
      category: item.category,
      width: item.width,
      length: item.length,
      height: item.height,
      color: item.color,
      position: { x: 0, z: 0 }, // Đặt ở giữa phòng (0,0)
      rotation: 0,
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

  const updateFurniturePosition = (
    id: string,
    position: { x: number; z: number }
  ) => {
    setFurniture((prev) =>
      prev.map((item) => (item.id === id ? { ...item, position } : item))
    );

    // Notify parent component about furniture movement
    if (onFurnitureMove) {
      onFurnitureMove(id, position);
    }
  };

  const updateFurnitureRotation = (id: string, rotation: number) => {
    setFurniture((prev) =>
      prev.map((item) => (item.id === id ? { ...item, rotation } : item))
    );
  };

  const getRoomArea = () => {
    return (width * length).toFixed(1);
  };

  const getUsedArea = () => {
    const usedArea = furniture.reduce((total, item) => {
      return total + item.width * item.length;
    }, 0);
    return usedArea.toFixed(1);
  };

  const getAvailableArea = () => {
    const usedArea = furniture.reduce((total, item) => {
      return total + item.width * item.length;
    }, 0);
    return (width * length - usedArea).toFixed(1);
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
                      <div className="text-xs text-gray-500">
                        {item.width}m × {item.length}m
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
                  <div className="text-xs text-gray-600">
                    ({item.position.x.toFixed(1)}, {item.position.z.toFixed(1)})
                    | {item.rotation}°
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
