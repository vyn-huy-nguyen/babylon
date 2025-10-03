import { useState, useEffect, useRef } from "react";

interface RoomInputProps {
  onRoomCreate: (width: number, length: number) => void;
}

export function RoomInput({ onRoomCreate }: RoomInputProps) {
  const [width, setWidth] = useState<number>(400);
  const [length, setLength] = useState<number>(500);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced function to update 3D room
  const debouncedUpdate = (newWidth: number, newLength: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      onRoomCreate(newWidth, newLength);
    }, 300); // 300ms delay
  };

  const handleWidthChange = (value: number) => {
    setWidth(value);
    // Trigger debounced real-time 3D update
    debouncedUpdate(value, length);
  };

  const handleLengthChange = (value: number) => {
    setLength(value);
    // Trigger debounced real-time 3D update
    debouncedUpdate(width, value);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Width Input */}
        <div>
          <label
            htmlFor="width"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Room Width (centimeters)
          </label>
          <div className="relative">
            <input
              id="width"
              type="number"
              min="100"
              max="1000"
              step="1"
              value={width}
              onChange={(e) =>
                handleWidthChange(parseFloat(e.target.value) || 0)
              }
              className="w-full text-[black] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
              placeholder="Enter width"
            />
            <span className="absolute right-3 top-2 text-gray-500 text-sm">
              cm
            </span>
          </div>
        </div>

        {/* Length Input */}
        <div>
          <label
            htmlFor="length"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Room Length (centimeters)
          </label>
          <div className="relative">
            <input
              id="length"
              type="number"
              min="100"
              max="1000"
              step="1"
              value={length}
              onChange={(e) =>
                handleLengthChange(parseFloat(e.target.value) || 0)
              }
              className="w-full text-[black] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
              placeholder="Enter length"
            />
            <span className="absolute right-3 top-2 text-gray-500 text-sm">
              cm
            </span>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Quick Presets
        </h3>
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => {
              setWidth(300);
              setLength(400);
              debouncedUpdate(300, 400);
            }}
            className="text-xs bg-gray-100 text-[black] hover:bg-gray-200 py-1 px-2 rounded transition-colors"
          >
            Small
          </button>
          <button
            type="button"
            onClick={() => {
              setWidth(400);
              setLength(500);
              debouncedUpdate(400, 500);
            }}
            className="text-xs bg-gray-100 text-[black] hover:bg-gray-200 py-1 px-2 rounded transition-colors"
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => {
              setWidth(500);
              setLength(600);
              debouncedUpdate(500, 600);
            }}
            className="text-xs bg-gray-100 text-[black] hover:bg-gray-200 py-1 px-2 rounded transition-colors"
          >
            Large
          </button>
          <button
            type="button"
            onClick={() => {
              setWidth(600);
              setLength(800);
              debouncedUpdate(600, 800);
            }}
            className="text-xs bg-gray-100 text-[black] hover:bg-gray-200 py-1 px-2 rounded transition-colors"
          >
            XL
          </button>
        </div>
      </div>
    </div>
  );
}
